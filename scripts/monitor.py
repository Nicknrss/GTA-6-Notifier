#!/usr/bin/env python3
"""Central monitor for GTA 6 Notifier. Uses public Atom feeds and PortWatch tracker."""
from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REPOS_DEFAULT = [
    'anrq0/SeriesX-Emulator',
    'avatarmanz/VIctory-7900XTX',
    'Belobug/VIctory-Belobug-AMD',
    'brcly/TuxBox',
    'californiaAlmonds/OpenScarlett',
    'Dark3581/AnyBox',
    'DexNom/VIctory',
    'edupode/anyxboxseries',
    'ethan00013/keylime',
    'Freminet/ScarlettX',
    'fxceless/victory-fork',
    'Hylanderry/DedSec',
    'ItsNotRexed/Leonida',
    'jadeowaowa/scarlett-layer',
    'JamesCicada/GTAVI-Recomp',
    'JPTuba9/xlaunch-vi',
    'Kajcsi/G6Recomp',
    'ljm-233/Xbgtasix',
    'LooperSalty/AnyXboxX',
    'luizwidmer/palmetto',
    'Marvisak/VIctory',
    'omonkeyz/xbox-emulator',
    'OnlyMoisties/GTA6-BootTest',
    'OpenCommunityEdition/OpenScarlett',
    'p-portela/SCARAB',
    'ProhorovIlja/NativeX-Runtime',
    'R0Y00/Xbox2Windows',
    'realdody/americas-recomp',
    'rpatty-dev/PercyScarlett',
    'sammwyy/xvalkyrie',
    'SSTGxf/ScarlettCompat',
    'Steinkoloss/port-of-the-americas',
    'stellarr-studio/kelvaroq',
    'ThatRecompDev/five-star-recomp',
    'trustno1-coder/VIctory-NVIDIA',
    'uiliannn/VItoriaBr',
    'xcl-dev/xcl',
    'Zettrox/ztrx',
    'zohaiblazuli/GrandTheftXbox',
]
TRACKER_URL = "https://portwatch-vi.xyz/data/tracker.json"
PORTWATCH_HOME = "https://portwatch-vi.xyz/"
USER_AGENT = "GTA-6-Notifier-Central/3.0 (+https://github.com/Nicknrss/GTA-6-Notifier)"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(name: str, default: dict) -> dict:
    path = DATA / name
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        value = json.load(f)
    return value if isinstance(value, dict) else default


def save_json(name: str, value: dict) -> None:
    path = DATA / name
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def fetch(url: str, accept: str = "*/*") -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    with urllib.request.urlopen(req, timeout=35) as response:
        return response.read()


def parse_atom(raw: bytes, repo: str) -> list[dict]:
    root = ET.fromstring(raw)
    ns = {"a": "http://www.w3.org/2005/Atom"}
    entries = []
    for item in root.findall("a:entry", ns):
        link_el = item.find("a:link", ns)
        entry_id = (item.findtext("a:id", default="", namespaces=ns) or "").strip()
        link = link_el.attrib.get("href", "") if link_el is not None else ""
        title = (item.findtext("a:title", default="Release", namespaces=ns) or "Release").strip()
        published = (item.findtext("a:published", default="", namespaces=ns) or
                     item.findtext("a:updated", default="", namespaces=ns) or "").strip()
        summary = (item.findtext("a:content", default="", namespaces=ns) or
                   item.findtext("a:summary", default="", namespaces=ns) or "").strip()
        if entry_id or link:
            entries.append({
                "id": entry_id or link, "repository": repo, "title": title,
                "published": published, "url": link or f"https://github.com/{repo}/releases",
                "summary": summary,
            })
    return entries


def clamp01(value) -> float:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0.0
    return min(1.0, max(0.0, n))


def ladder_value(value) -> float:
    if value is True:
        return 1.0
    if value is False or value is None:
        return 0.0
    return clamp01(value)


def effort_score(effort: dict) -> float:
    # Mirrors the score calculation already present in extension/chromium/background.js.
    gw = effort.get("groundwork") or {}
    groundwork = (
        0.20 * clamp01(gw.get("loader"))
        + 0.28 * clamp01(gw.get("shaders"))
        + 0.32 * clamp01(gw.get("graphics"))
        + 0.20 * clamp01(gw.get("proven"))
    )
    gta = effort.get("gta") or {}
    ticks = {"loads": 10, "boots": 20, "menu": 30, "world": 40, "playable": 50}
    score = 10 * groundwork
    previous = score
    reached = "groundwork"
    for key in ("loads", "boots", "menu", "world", "playable"):
        value = ladder_value(gta.get(key))
        if value >= 1:
            score = ticks[key]
            previous = score
            reached = key
            continue
        if value > 0:
            score = max(score, previous + value * (ticks[key] - previous))
        break
    if reached == "playable":
        stability_map = {
            "unknown": 0, "constant": 0, "often": 0.25,
            "sometimes": 0.55, "rarely": 0.8, "stable": 1,
        }
        stability_raw = gta.get("stability", "unknown")
        stability = clamp01(stability_raw) if isinstance(stability_raw, (int, float)) else stability_map.get(stability_raw, 0)
        quality = (
            0.35 * clamp01(gta.get("story"))
            + 0.25 * clamp01(gta.get("render"))
            + 0.20 * clamp01((float(gta.get("fps") or 0)) / 30)
            + 0.20 * stability
        )
        score = 50 + quality * 50
    manual = effort.get("manualScore")
    if isinstance(manual, (int, float)):
        score = min(100, max(0, manual))
    return round(score, 1)


def get_ranking(tracker: dict) -> list[dict]:
    efforts = tracker.get("efforts") if isinstance(tracker.get("efforts"), list) else []
    rows = []
    for e in efforts:
        if str(e.get("tier", "")).lower() != "tracked" or e.get("nuked"):
            continue
        name = e.get("name") or e.get("title") or e.get("owner") or e.get("slug") or e.get("repo") or e.get("repository") or "Projeto sem nome"
        identity = str(e.get("id") or e.get("repo") or e.get("slug") or e.get("repository") or name)
        rows.append({"id": identity, "name": name, "score": effort_score(e), "stars": int((e.get("stats") or {}).get("stars") or 0)})
    rows.sort(key=lambda x: (-x["score"], -x["stars"], x["name"].casefold()))
    return [{"id": x["id"], "name": x["name"], "score": x["score"], "position": i + 1} for i, x in enumerate(rows)]


def latest_progress(ranking: list[dict]) -> tuple[float | None, str | None]:
    """Use the latest PortWatch checkpoint: the current top tracked score."""
    if not ranking:
        return None, None
    leader = ranking[0]
    return round(float(leader["score"]), 1), str(leader.get("name") or "")


HISTORICAL_MILESTONES = [
    ("AvatarManz", 81.8),
    ("Doomsday", 82.1),
    ("DarkWorldHM", 84.8),
    ("NotchNose", 87.1),
    ("CGBJ", 89.6),
    ("BelloBug", 91.3),
]


def seed_progress_history(progress: dict) -> None:
    """Keep chart milestones separate from live measurements and never invent dates."""
    checkpoints = [
        {"timestamp": None, "label": name, "value": value,
         "method": "user-provided-historical-checkpoint", "sequence": index}
        for index, (name, value) in enumerate(HISTORICAL_MILESTONES, start=1)
    ]
    progress["chartHistory"] = checkpoints
    progress["chartHistoryDescription"] = "Marcos históricos fornecidos pelo usuário; separados das medições dinâmicas."
    if not progress.get("history"):
        progress["history"] = list(checkpoints)
    if progress.get("currentProgress") is None:
        progress["currentProgress"] = HISTORICAL_MILESTONES[-1][1]
    progress["highestRecorded"] = max(float(progress.get("highestRecorded") or 0), 91.3)
    progress["calculation"] = "Última pontuação registrada no ranking PortWatch; não é média."


def stable_id(source: str, external_id: str) -> str:
    return hashlib.sha256(f"{source}:{external_id}".encode("utf-8")).hexdigest()[:24]


def make_event(source: str, category: str, title: str, message: str, url: str, external_id: str, timestamp: str) -> dict:
    return {
        "id": stable_id(source, external_id),
        "timestamp": timestamp,
        "source": source,
        "category": category,
        "title": title,
        "message": message,
        "url": url,
        "externalId": external_id,
    }


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    now = utc_now()
    history = load_json("history.json", {"schemaVersion": 1, "lastUpdated": None, "events": []})
    gh = load_json("github-releases.json", {"schemaVersion": 1, "lastUpdated": None, "repositories": REPOS_DEFAULT, "releases": []})
    progress = load_json("portwatch-progress.json", {"schemaVersion": 1, "lastUpdated": None, "currentProgress": None, "highestRecorded": None, "history": []})
    leaderboard = load_json("portwatch-leaderboard.json", {"schemaVersion": 1, "lastUpdated": None, "entries": [], "history": []})

    history.setdefault("events", [])
    gh.setdefault("releases", [])
    gh.setdefault("repositories", REPOS_DEFAULT)
    progress.setdefault("history", [])
    leaderboard.setdefault("entries", [])
    leaderboard.setdefault("history", [])

    known_release_ids = {r.get("id") for r in gh["releases"] if isinstance(r, dict)}
    gh_baseline = bool(gh.get("baselineComplete"))
    new_events: list[dict] = []

    # GitHub: poll only public Atom feeds. First run is intentionally silent.
    for repo in gh["repositories"]:
        try:
            entries = parse_atom(fetch(f"https://github.com/{repo}/releases.atom", "application/atom+xml, application/xml"), repo)
            for release in entries:
                if release["id"] not in known_release_ids:
                    if gh_baseline:
                        new_events.append(make_event(
                            "github", "githubRelease", f"Novo Release: {repo}",
                            f"{release['title']} — {repo}", release["url"], release["id"], now
                        ))
                    gh["releases"].append(release)
                    known_release_ids.add(release["id"])
        except Exception as exc:
            print(f"GitHub feed error [{repo}]: {exc}")
    gh["baselineComplete"] = True
    gh["lastUpdated"] = now

    # PortWatch: only tracked, non-nuked efforts. First read silently establishes baseline.
    try:
        tracker = json.loads(fetch(TRACKER_URL, "application/json").decode("utf-8"))
        current = get_ranking(tracker)
        previous = leaderboard["entries"]
        pw_baseline = bool(leaderboard.get("baselineComplete"))
        if pw_baseline:
            old_by_id = {str(x.get("id")): x for x in previous}
            new_by_id = {str(x.get("id")): x for x in current}
            changes = []
            for row in current:
                old = old_by_id.get(str(row["id"]))
                if old is None:
                    changes.append(f"Entrou no ranking: {row['name']} ({row['score']:.1f}%)")
                elif float(old.get("score", 0)) != row["score"]:
                    changes.append(f"{row['name']}: {float(old.get('score', 0)):.1f}% → {row['score']:.1f}%")
                old_pos = old.get("position") if old else None
                if old_pos and old_pos != row["position"]:
                    changes.append(f"{row['name']}: posição {old_pos} → {row['position']}")
            for old in previous:
                if str(old.get("id")) not in new_by_id:
                    changes.append(f"Saiu do ranking: {old.get('name', 'Projeto')}")
            old_leader = previous[0] if previous else None
            new_leader = current[0] if current else None
            if old_leader and new_leader and old_leader.get("id") != new_leader.get("id"):
                changes.insert(0, f"Novo líder: {new_leader['name']} (antes: {old_leader.get('name', '—')})")
            if changes:
                external = hashlib.sha256(json.dumps(current, sort_keys=True).encode()).hexdigest()
                new_events.append(make_event(
                    "portwatch", "portRanking", "Atualização do ranking PortWatch VI",
                    "\n".join(changes[:30]), PORTWATCH_HOME, external, now
                ))
        # Keep a useful historical series: record a snapshot only when the
        # ranking or one of its scores/positions actually changes.
        if current != previous:
            leaderboard["history"].append({"timestamp": now, "entries": current})
        leaderboard["entries"] = current
        leaderboard["baselineComplete"] = True
        leaderboard["lastUpdated"] = now

        # The current value follows the latest PortWatch ranking checkpoint,
        # not an arithmetic mean. Historical user-supplied milestones are seeded once.
        seed_progress_history(progress)
        new_value, latest_label = latest_progress(current)
        old_value = progress.get("currentProgress")
        if new_value is not None:
            if old_value is None or float(old_value) != new_value:
                progress["history"].append({
                    "timestamp": now, "label": latest_label, "value": new_value,
                    "method": "latest-portwatch-ranking-checkpoint"
                })
                if pw_baseline and old_value is not None:
                    external = f"latest-portwatch:{float(old_value):.1f}:{new_value:.1f}:{latest_label}"
                    new_events.append(make_event(
                        "portwatch", "portGeneral", "Novo progresso PortWatch VI",
                        f"Último registro ({latest_label}): {float(old_value):.1f}% → {new_value:.1f}%",
                        PORTWATCH_HOME, external, now
                    ))
            progress["currentProgress"] = new_value
            progress["latestCheckpoint"] = latest_label
            prior_high = progress.get("highestRecorded")
            progress["highestRecorded"] = new_value if prior_high is None else max(float(prior_high), new_value)
            progress["calculation"] = "Última pontuação registrada no ranking PortWatch; não é média."
        progress["lastUpdated"] = now
    except Exception as exc:
        print(f"PortWatch tracker error: {exc}")

    # Merge by stable event ID so retries and overlapping runs never duplicate history.
    existing_ids = {e.get("id") for e in history["events"] if isinstance(e, dict)}
    appended = []
    for event in new_events:
        if event["id"] not in existing_ids:
            history["events"].append(event)
            existing_ids.add(event["id"])
            appended.append(event)

    # Preserve the complete central history; no arbitrary 300-event truncation.
    history["lastUpdated"] = now
    save_json("history.json", history)
    save_json("github-releases.json", gh)
    save_json("portwatch-progress.json", progress)
    save_json("portwatch-leaderboard.json", leaderboard)

    print(f"Completed at {now}: {len(appended)} new event(s), {len(gh['repositories'])} GitHub feeds configured.")


if __name__ == "__main__":
    main()
