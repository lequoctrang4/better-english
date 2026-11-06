#!/usr/bin/env python3
"""Công cụ quản lý dữ liệu học tiếng Anh (từ vựng + mẫu câu) với lặp lại ngắt quãng.

Dữ liệu: data/vocab.json, data/phrases.json, data/mistakes.json
Claude gọi script này để đọc/ghi dữ liệu thay vì sửa JSON bằng tay,
giúp ngày ôn tập và thống kê luôn chính xác.

Ví dụ:
  python3 scripts/eng.py stats
  python3 scripts/eng.py due --limit 15
  python3 scripts/eng.py add vocab --text "approach" --meaning "cách tiếp cận" --pos noun/verb
  python3 scripts/eng.py grade "approach" good
  python3 scripts/eng.py render
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
FILES = {"vocab": DATA / "vocab.json", "phrase": DATA / "phrases.json"}
MISTAKES = DATA / "mistakes.json"
LOGS = ROOT / "logs"

# Hệ Leitner: box -> số ngày tới lần ôn kế tiếp
INTERVALS = [0, 1, 3, 7, 14, 30, 90]
MAX_BOX = len(INTERVALS) - 1
# Trạng thái suy ra từ box
STATUS_BY_BOX = {0: "learning", 1: "learning", 2: "learning", 3: "known", 4: "known", 5: "mastered", 6: "mastered"}

TODAY = date.today()


def load(kind: str) -> list[dict]:
    path = FILES[kind]
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save(kind: str, items: list[dict]) -> None:
    items.sort(key=lambda x: x["text"].lower())
    FILES[kind].write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def find(items: list[dict], text: str) -> dict | None:
    key = text.strip().lower()
    return next((i for i in items if i["text"].lower() == key), None)


def find_any(text: str) -> tuple[str, list[dict], dict] | None:
    for kind in FILES:
        items = load(kind)
        item = find(items, text)
        if item:
            return kind, items, item
    return None


def is_due(item: dict) -> bool:
    return item["status"] != "unrated" and date.fromisoformat(item["next_review"]) <= TODAY


def schedule(item: dict, box: int) -> None:
    box = max(0, min(MAX_BOX, box))
    item["box"] = box
    item["status"] = STATUS_BY_BOX[box]
    item["next_review"] = (TODAY + timedelta(days=INTERVALS[box])).isoformat()


# ---------- lệnh ----------

def cmd_stats(args) -> None:
    out = {}
    for kind in FILES:
        items = load(kind)
        counts: dict[str, int] = {}
        for i in items:
            counts[i["status"]] = counts.get(i["status"], 0) + 1
        out[kind] = {
            "total": len(items),
            "by_status": counts,
            "due_today": sum(is_due(i) for i in items),
            "added_last_7_days": sum(date.fromisoformat(i["added"]) > TODAY - timedelta(days=7) for i in items),
        }
    logs = sorted(p.stem for p in LOGS.glob("????-??-??.md")) if LOGS.exists() else []
    streak = 0
    d = TODAY
    while d.isoformat() in logs:
        streak += 1
        d -= timedelta(days=1)
    if streak == 0 and (TODAY - timedelta(days=1)).isoformat() in logs:
        d = TODAY - timedelta(days=1)
        while d.isoformat() in logs:
            streak += 1
            d -= timedelta(days=1)
    out["study_days_total"] = len(logs)
    out["streak_days"] = streak
    out["last_session"] = logs[-1] if logs else None
    out["mistakes_logged"] = len(json.loads(MISTAKES.read_text(encoding="utf-8"))) if MISTAKES.exists() else 0
    print(json.dumps(out, ensure_ascii=False, indent=2))


def cmd_due(args) -> None:
    result = []
    for kind in FILES if args.kind == "all" else [args.kind]:
        for i in load(kind):
            if is_due(i):
                result.append({"kind": kind, **i})
    # Ưu tiên: box thấp trước (yếu nhất), rồi quá hạn lâu nhất
    result.sort(key=lambda x: (x["box"], x["next_review"]))
    print(json.dumps(result[: args.limit], ensure_ascii=False, indent=2))
    print(f"# {len(result)} mục đến hạn, hiển thị {min(len(result), args.limit)}", file=sys.stderr)


def cmd_list(args) -> None:
    items = load(args.kind)
    if args.status:
        items = [i for i in items if i["status"] == args.status]
    if args.tag:
        items = [i for i in items if args.tag in i.get("tags", [])]
    if args.brief:
        for i in items:
            print(f"{i['text']}\t{i['status']}\tbox{i['box']}\t{i['meaning']}")
    else:
        print(json.dumps(items, ensure_ascii=False, indent=2))


def cmd_add(args) -> None:
    if find_any(args.text):
        kind, _, item = find_any(args.text)
        sys.exit(f"Đã có trong {kind}: {item['text']} ({item['status']}). Dùng 'update' để sửa.")
    items = load(args.kind)
    item = {
        "text": args.text.strip(),
        "pos": args.pos or "",
        "ipa": args.ipa or "",
        "meaning": args.meaning,
        "example": args.example or "",
        "example_vi": args.example_vi or "",
        "collocations": [c.strip() for c in (args.collocations or "").split(";") if c.strip()],
        "note": args.note or "",
        "tags": [t.strip() for t in (args.tags or "").split(",") if t.strip()],
        "source": args.source or "",
        "added": TODAY.isoformat(),
        "last_review": None,
        "reviews": 0,
        "lapses": 0,
    }
    if args.kind == "phrase":
        item.pop("pos")
        item.pop("ipa")
    if args.known:
        schedule(item, 3)
    else:
        schedule(item, 0)
    items.append(item)
    save(args.kind, items)
    print(f"Đã thêm [{args.kind}] {item['text']} → box {item['box']}, ôn lại {item['next_review']}")


def cmd_update(args) -> None:
    hit = find_any(args.text)
    if not hit:
        sys.exit(f"Không tìm thấy: {args.text}")
    kind, items, item = hit
    for field, value in json.loads(args.json).items():
        item[field] = value
    save(kind, items)
    print(f"Đã cập nhật [{kind}] {item['text']}")


def cmd_grade(args) -> None:
    """again = quên; hard = nhớ lờ mờ; good = nhớ đúng; easy = nhớ ngay, dùng được."""
    hit = find_any(args.text)
    if not hit:
        sys.exit(f"Không tìm thấy: {args.text}")
    kind, items, item = hit
    box = item["box"]
    if args.result == "again":
        item["lapses"] += 1
        new_box = 0
    elif args.result == "hard":
        new_box = max(1, box)
    elif args.result == "good":
        new_box = box + 1
    else:  # easy
        new_box = box + 2
    schedule(item, new_box)
    # Ôn lại ngay trong ngày thì đẩy sang mai để không lặp vô hạn
    if item["next_review"] == TODAY.isoformat():
        item["next_review"] = (TODAY + timedelta(days=1)).isoformat()
    item["reviews"] += 1
    item["last_review"] = TODAY.isoformat()
    save(kind, items)
    print(f"{item['text']}: {args.result} → box {item['box']} ({item['status']}), ôn lại {item['next_review']}")


def cmd_rate(args) -> None:
    """Xác nhận từ 'unrated': đã biết (known) hay chưa biết (new)."""
    hit = find_any(args.text)
    if not hit:
        sys.exit(f"Không tìm thấy: {args.text}")
    kind, items, item = hit
    schedule(item, 3 if args.answer == "known" else 0)
    save(kind, items)
    print(f"{item['text']} → {item['status']}, ôn lại {item['next_review']}")


def cmd_mistake(args) -> None:
    items = json.loads(MISTAKES.read_text(encoding="utf-8")) if MISTAKES.exists() else []
    existing = next((m for m in items if m["wrong"].lower() == args.wrong.lower()), None)
    if existing:
        existing["count"] += 1
        existing["last_seen"] = TODAY.isoformat()
    else:
        items.append({
            "wrong": args.wrong,
            "right": args.right,
            "rule": args.rule,
            "category": args.category,
            "count": 1,
            "first_seen": TODAY.isoformat(),
            "last_seen": TODAY.isoformat(),
        })
    items.sort(key=lambda m: -m["count"])
    MISTAKES.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Đã ghi lỗi: {args.wrong} → {args.right}")


def cmd_render(args) -> None:
    """Sinh VOCAB.md — bản dễ đọc của toàn bộ dữ liệu (không sửa tay)."""
    labels = {"mastered": "Thành thạo", "known": "Đã biết", "learning": "Đang học", "unrated": "Chưa xác định"}
    lines = [
        "# Sổ tay tiếng Anh",
        "",
        f"> File tự sinh bởi `python3 scripts/eng.py render` — cập nhật {TODAY.isoformat()}. Đừng sửa tay.",
        "",
    ]
    for kind, title in (("vocab", "Từ vựng"), ("phrase", "Mẫu câu & cụm từ")):
        items = load(kind)
        lines += [f"## {title} ({len(items)})", ""]
        for status in ("learning", "unrated", "known", "mastered"):
            group = [i for i in items if i["status"] == status]
            if not group:
                continue
            lines += [f"### {labels[status]} ({len(group)})", ""]
            if kind == "vocab":
                lines += ["| Từ | Loại | IPA | Nghĩa | Ví dụ | Ôn lại |", "|---|---|---|---|---|---|"]
                for i in group:
                    lines.append(f"| **{i['text']}** | {i['pos']} | {i['ipa']} | {i['meaning']} | {i['example']} | {i['next_review']} |")
            else:
                lines += ["| Mẫu câu | Nghĩa | Ví dụ | Ôn lại |", "|---|---|---|---|"]
                for i in group:
                    lines.append(f"| **{i['text']}** | {i['meaning']} | {i['example']} | {i['next_review']} |")
            lines.append("")
    if MISTAKES.exists():
        mistakes = json.loads(MISTAKES.read_text(encoding="utf-8"))
        if mistakes:
            lines += [f"## Lỗi hay gặp ({len(mistakes)})", "", "| Sai | Đúng | Quy tắc | Số lần |", "|---|---|---|---|"]
            for m in mistakes:
                lines.append(f"| ~~{m['wrong']}~~ | {m['right']} | {m['rule']} | {m['count']} |")
            lines.append("")
    (ROOT / "VOCAB.md").write_text("\n".join(lines), encoding="utf-8")
    print("Đã cập nhật VOCAB.md")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("stats", help="Thống kê tiến độ").set_defaults(fn=cmd_stats)

    s = sub.add_parser("due", help="Các mục đến hạn ôn")
    s.add_argument("--kind", choices=["vocab", "phrase", "all"], default="all")
    s.add_argument("--limit", type=int, default=20)
    s.set_defaults(fn=cmd_due)

    s = sub.add_parser("list", help="Liệt kê dữ liệu")
    s.add_argument("kind", choices=list(FILES))
    s.add_argument("--status", choices=["unrated", "learning", "known", "mastered"])
    s.add_argument("--tag")
    s.add_argument("--brief", action="store_true", help="Một dòng mỗi mục")
    s.set_defaults(fn=cmd_list)

    s = sub.add_parser("add", help="Thêm từ / mẫu câu")
    s.add_argument("kind", choices=list(FILES))
    s.add_argument("--text", required=True)
    s.add_argument("--meaning", required=True)
    s.add_argument("--pos")
    s.add_argument("--ipa")
    s.add_argument("--example")
    s.add_argument("--example-vi")
    s.add_argument("--collocations", help="Ngăn cách bằng ;")
    s.add_argument("--note")
    s.add_argument("--tags", help="Ngăn cách bằng ,")
    s.add_argument("--source")
    s.add_argument("--known", action="store_true", help="Người học đã biết → bắt đầu ở box 3")
    s.set_defaults(fn=cmd_add)

    s = sub.add_parser("update", help="Sửa trường của một mục")
    s.add_argument("text")
    s.add_argument("json", help='VD: \'{"example": "..."}\'')
    s.set_defaults(fn=cmd_update)

    s = sub.add_parser("grade", help="Chấm kết quả ôn tập")
    s.add_argument("text")
    s.add_argument("result", choices=["again", "hard", "good", "easy"])
    s.set_defaults(fn=cmd_grade)

    s = sub.add_parser("rate", help="Xác nhận từ chưa xác định")
    s.add_argument("text")
    s.add_argument("answer", choices=["known", "new"])
    s.set_defaults(fn=cmd_rate)

    s = sub.add_parser("mistake", help="Ghi lại lỗi sai hay gặp")
    s.add_argument("--wrong", required=True)
    s.add_argument("--right", required=True)
    s.add_argument("--rule", required=True)
    s.add_argument("--category", default="grammar", choices=["grammar", "word-choice", "collocation", "spelling", "preposition", "tense", "article", "naturalness"])
    s.set_defaults(fn=cmd_mistake)

    sub.add_parser("render", help="Sinh lại VOCAB.md").set_defaults(fn=cmd_render)

    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
