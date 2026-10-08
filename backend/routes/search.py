import re
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import httpx

from database import get_db
from models import User, SearchLog
from auth_utils import get_current_user

router = APIRouter(prefix="/api", tags=["Search"])


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.status != "approved":
        raise HTTPException(status_code=403, detail="Your account is not approved yet")

    results = []
    seen_urls = set()

    # 1. DuckDuckGo Instant Answer API
    try:
        url = "https://api.duckduckgo.com/"
        params = {"q": q, "format": "json", "no_html": 1, "skip_disambig": 1}
        headers = {"User-Agent": "CollegeSearchEngine/1.0 (Educational Student Project)"}
        async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                if data.get("Abstract") and data.get("AbstractURL"):
                    abs_url = data.get("AbstractURL", "")
                    if abs_url not in seen_urls:
                        seen_urls.add(abs_url)
                        results.append({
                            "title": data.get("Heading", q),
                            "url": abs_url,
                            "description": data.get("Abstract", ""),
                            "source": data.get("AbstractSource", "Instant Answer"),
                        })

                for topic in data.get("RelatedTopics", [])[:5]:
                    if isinstance(topic, dict) and "Text" in topic and topic.get("FirstURL"):
                        top_url = topic.get("FirstURL", "")
                        if top_url not in seen_urls:
                            seen_urls.add(top_url)
                            results.append({
                                "title": topic.get("Text", "")[:80],
                                "url": top_url,
                                "description": topic.get("Text", ""),
                                "source": "DuckDuckGo",
                            })
    except Exception as e:
        print(f"[!] DuckDuckGo Instant API error: {e}")

    # 2. DuckDuckGo HTML Search
    try:
        ddg_results = await _ddg_html_search(q)
        for r in ddg_results:
            if r["url"] not in seen_urls:
                seen_urls.add(r["url"])
                results.append(r)
    except Exception as e:
        print(f"[!] DuckDuckGo HTML error: {e}")

    # 3. Wikipedia Search Fallback (ensures rich encyclopedia & academic results)
    if len(results) < 5:
        try:
            wiki_results = await _wikipedia_search(q)
            for r in wiki_results:
                if r["url"] not in seen_urls:
                    seen_urls.add(r["url"])
                    results.append(r)
        except Exception as e:
            print(f"[!] Wikipedia search error: {e}")

    # Save to search log
    try:
        search_log = SearchLog(
            user_id=current_user.id,
            query=q,
            results_count=len(results),
        )
        db.add(search_log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Error logging search: {e}")

    return {"query": q, "results": results[:20], "total": len(results[:20])}


async def _ddg_html_search(query: str) -> list:
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    async with httpx.AsyncClient(timeout=8.0, headers=headers, follow_redirects=True) as client:
        response = await client.post("https://html.duckduckgo.com/html/", data={"q": query})

    if response.status_code == 200:
        text = response.text
        result_blocks = re.findall(
            r'<a rel="nofollow" class="result__a" href="([^"]*)"[^>]*>(.*?)</a>.*?'
            r'<a class="result__snippet"[^>]*>(.*?)</a>',
            text, re.DOTALL
        )
        for link, title, snippet in result_blocks[:15]:
            title = re.sub(r'<[^>]+>', '', title).strip()
            snippet = re.sub(r'<[^>]+>', '', snippet).strip()

            # Unwrap redirect URL
            if "uddg=" in link:
                match = re.search(r'uddg=([^&]+)', link)
                if match:
                    link = urllib.parse.unquote(match.group(1))
            elif link.startswith("//"):
                link = "https:" + link

            if title and link and not link.startswith("https://duckduckgo.com/y.js"):
                results.append({
                    "title": title,
                    "url": link,
                    "description": snippet,
                    "source": "Web",
                })
    return results


async def _wikipedia_search(query: str) -> list:
    results = []
    headers = {"User-Agent": "CollegeSearchEngine/1.0 (Student Educational Search; support@collegesearch.edu)"}
    async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
        response = await client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "utf8": 1,
                "format": "json",
                "srlimit": 8,
            }
        )
    if response.status_code == 200:
        data = response.json()
        items = data.get("query", {}).get("search", [])
        for item in items:
            title = item.get("title", "")
            snippet = re.sub(r'<[^>]+>', '', item.get("snippet", "")).strip()
            page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
            results.append({
                "title": title,
                "url": page_url,
                "description": snippet,
                "source": "Wikipedia",
            })
    return results


@router.get("/search-history")
def get_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(SearchLog)
        .filter(SearchLog.user_id == current_user.id)
        .order_by(SearchLog.searched_at.desc())
        .limit(50)
        .all()
    )
    return {
        "history": [
            {
                "query": log.query,
                "results_count": log.results_count,
                "searched_at": log.searched_at.isoformat() if log.searched_at else "",
            }
            for log in logs
        ]
    }