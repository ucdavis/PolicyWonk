"""Read-only production sampling. Never sends questions to a model."""
import argparse, collections, datetime, hashlib, json, os, re, subprocess
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import psycopg2

PATTERNS = {
    'email': r'\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b',
    'phone_or_identifier': r'(?<!\d)(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}(?!\d)|\b\d{3}-\d{2}-\d{4}\b',
    'identifier_label': r'\b(?:student|employee|patient|account|medical record|social security)\s*(?:id|number|#)\s*[:#]?\s*\w+\b',
    'personal_name': r'\b(?:my name is|my name\s*:|named|Dr\.|Professor|Mr\.|Mrs\.|Ms\.)\s+[A-Z][a-z]+',
    'address': r'\b\d{1,6}\s+(?:[\w]+\s+){1,4}(?:Street|St\.|Road|Rd\.|Avenue|Ave\.|Lane|Ln\.)\b',
    'private_url': r'https?://\S+[?=]\S*',
}

def az_settings(subscription, group, name):
    rows = json.loads(subprocess.check_output(['az', 'webapp', 'config', 'appsettings', 'list', '--subscription', subscription, '-g', group, '-n', name, '-o', 'json']))
    return {v['name']: v['value'] for v in rows}

def sample(output, count):
    os.umask(0o077)
    output.mkdir(parents=True, exist_ok=True)
    if (output / 'review.jsonl').exists():
        raise SystemExit('Review file already exists; choose a new dataset directory.')
    settings = az_settings('003283b1-cc5e-417a-b037-01ff3c05537b', 'policy', 'policywonk')
    u = urlsplit(settings['DATABASE_URL'])
    u = u._replace(query=urlencode([(k,v) for k,v in parse_qsl(u.query) if k not in ['schema','pgbouncer','connection_limit','pool_timeout']]))
    connection = psycopg2.connect(urlunsplit(u), connect_timeout=15)
    connection.set_session(readonly=True)
    stats = collections.Counter()
    candidates, seen = [], set()
    with connection, connection.cursor() as cursor:
        cursor.execute("SET LOCAL statement_timeout = '30s'")
        cursor.execute('''SELECT c.timestamp::date, c."group", c.meta->'focus', q.content
            FROM chats c CROSS JOIN LATERAL (
              SELECT m->>'content' AS content FROM json_array_elements(c.messages) WITH ORDINALITY AS x(m,n)
              WHERE m->>'role'='user' AND length(trim(coalesce(m->>'content','')))>0 ORDER BY n LIMIT 1
            ) q WHERE c.active AND c.assistant_slug='policywonk' ORDER BY c.timestamp DESC, c.id DESC LIMIT 3000''')
        for day, group, focus, question in cursor:
            stats['examined'] += 1
            question = ' '.join(question.split())
            if len(question) < 12 or re.fullmatch(r'(hi|hello|hey|hola|test|thanks)[!.? ]*',question,re.I):
                stats['short_or_greeting'] += 1; continue
            if len(question) > 1200:
                stats['long_question_manual_scope'] += 1; continue
            if not isinstance(focus, dict) or focus.get('name') not in ['core','ucop','apm','unions','knowledgebase']:
                stats['missing_scope'] += 1; continue
            flags = [name for name, pattern in PATTERNS.items() if re.search(pattern,question,re.I)]
            if flags:
                stats['identifier_filter'] += 1; continue
            key = (question.casefold(),group,focus.get('name'),focus.get('subFocus'))
            if key in seen:
                stats['duplicates'] += 1; continue
            seen.add(key)
            candidates.append({'id':f'q{len(candidates)+1:03}','question':question,'group':group,'focus':{'name':focus['name'],**({'subFocus':focus['subFocus']} if focus.get('subFocus') else {})},'day':str(day),'decision':'pending'})
            if len(candidates)>=count: break
    connection.close()
    (output/'review.jsonl').write_text(''.join(json.dumps(c,ensure_ascii=False)+'\n' for c in candidates))
    (output/'sample-stats.json').write_text(json.dumps({'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'stats':dict(stats),'candidates':len(candidates),'note':'Successful saved active chats only; not a representative sample of failed requests. Local review required; regex filtering is not a PII guarantee.'},indent=2))
    print(json.dumps({'review_candidates':len(candidates),'excluded_counts':dict(stats)}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--candidates',type=int,default=130);a=p.parse_args();sample(a.out,a.candidates)
