#!/usr/bin/env python3
"""把导出的「数据备份.json」变成一份 SQL，用来把数据放回一个新的数据库。

用法：
    python3 备份转SQL.py 数据备份.json            # 生成 恢复数据.sql，放在备份文件旁边

顺序：
    1. 新建一个 Supabase 项目，在 SQL Editor 里跑 SQL/00-从零重建数据库.sql
    2. 再跑这里生成的 恢复数据.sql
    3. 设后台口令（重建脚本最后有说明），把网页代码里的数据库地址和 key 换成新项目的

只用 Python 自带的功能，不用装任何东西。
"""
import json, os, sys


def q(v):
    return "null" if v is None else "'" + str(v).replace("'", "''") + "'"


def j(v):
    return q(json.dumps(v, ensure_ascii=False)) + "::jsonb"


def main(path):
    b = json.load(open(path, encoding="utf-8"))
    d, at = b["data"], b.get("exported_at", "")
    out = ["-- 由 备份转SQL.py 生成。数据导出于 " + at,
           "-- 在已经跑过「00-从零重建数据库.sql」的空数据库里跑一次。", "begin;", ""]

    talk = {r["name"]: r.get("talk") or "" for r in d.get("bday_rsvp_list3") or []}
    out.append("-- 报名（含只有主人看得到的忌口）")
    for r in b.get("rsvp_full") or []:
        out.append("insert into bday_rsvp (name, arrive, mode, diet, role, dish, talk, updated_at) values (%s, %s, %s, %s, %s, %s, %s, %s) on conflict (name) do nothing;" % (
            q(r["name"]), q(r.get("arrive") or ""), q(r.get("mode") or ""), q(r.get("diet") or ""), q(r.get("role") or ""), q(r.get("dish") or ""),
            q(talk.get(r["name"], "")), q(r["updated_at"]) if r.get("updated_at") else "now()"))

    flags = d.get("bday_flags_get") or {}
    out += ["", "-- 嘉宾卡片：身份、一句话、封面照、国旗"]
    for i, c in enumerate(d.get("bday_guests_get") or []):
        out.append("insert into bday_guest (name, title, line, photo, flag, added_at) values (%s, %s, %s, %s, %s, now() + interval '%d milliseconds') on conflict (name) do nothing;" % (
            q(c["name"]), q(c.get("title") or ""), q(c.get("line") or ""), q(c.get("photo") or ""), q(flags.get(c["name"], "")), i))

    out += ["", "-- 表情"]
    for i, r in enumerate(d.get("bday_react_list") or []):
        out.append("insert into bday_react (guest, emoji, who, at) values (%s, %s, %s, now() + interval '%d milliseconds') on conflict do nothing;" % (q(r["guest"]), q(r["emoji"]), q(r["who"]), i))

    out += ["", "-- 卡片上的留言"]
    for n in d.get("bday_notes_list") or []:
        out.append("insert into bday_note (guest, body, who) values (%s, %s, %s);" % (q(n["guest"]), q(n["body"]), q(n.get("who") or "")))

    out += ["", "-- 相册照片"]
    for g, pics in (d.get("pics") or {}).items():
        for p in pics:
            out.append("insert into bday_pic (guest, photo, who) values (%s, %s, %s);" % (q(g), q(p["photo"]), q(p.get("who") or "")))

    out += ["", "-- 厨房分组、爱心、置顶"]
    if d.get("bday_teams_get") is not None:
        out.append("update bday_admin set teams = %s where id = 1;" % j(d["bday_teams_get"]))
    if d.get("bday_hearts_get") is not None:
        out.append("update bday_admin set hearts = %s where id = 1;" % j(d["bday_hearts_get"]))

    # 抹蛋糕和碰杯：备份里只有总数和前三名，没有每一次的记录。这里按总数和榜单补回同样多条，时间记成导出那一刻。
    toy = d.get("bday_poke_state") or {}
    out += ["", "-- 抹蛋糕和碰杯（按总数和榜单补回）"]
    when = q(at) if at else "now()"
    for kind, total, top in (("drink", toy.get("drinks") or 0, toy.get("top") or []), ("cake", toy.get("cakes") or 0, toy.get("ctop") or [])):
        left = int(total)
        for t in top:
            n = min(int(t["n"]), left); left -= n
            if n: out.append("insert into bday_poke (kind, who, at) select %s, %s, %s::timestamptz + (g || ' milliseconds')::interval from generate_series(1, %d) g;" % (q(kind), q(t["who"]), when, n))
        if left: out.append("insert into bday_poke (kind, who, at) select %s, '', %s::timestamptz - interval '1 second' from generate_series(1, %d);" % (q(kind), when, left))

    out += ["", "commit;", ""]
    dest = os.path.join(os.path.dirname(os.path.abspath(path)), "恢复数据.sql")
    open(dest, "w", encoding="utf-8").write("\n".join(out))
    print("写好了：" + dest)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
