"""Pass scoped credentials in memory to the local runner; never write keys to disk."""
import os, subprocess, sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from sample import az_settings
root=Path(__file__).resolve().parents[2]
env=os.environ.copy()
if len(sys.argv)>1 and sys.argv[1] in ['prepare','run','recheck']:
    prod=az_settings('003283b1-cc5e-417a-b037-01ff3c05537b','policy','policywonk')
    test=az_settings('105dede4-4731-492e-8c28-5121226319b0','policywonk-dev','policywonk-test')
    for key in ['DATABASE_URL','ELASTIC_URL','ELASTIC_INDEX','ELASTIC_SEARCHER_USERNAME','ELASTIC_SEARCHER_PASSWORD','OPENAI_EMBEDDING_MODEL']:
        env[key]=prod[key]
    u=urlsplit(env['DATABASE_URL']);q=dict(parse_qsl(u.query));q['options']='-c default_transaction_read_only=on';env['DATABASE_URL']=urlunsplit(u._replace(query=urlencode(q)))
    env['OPENAI_API_KEY']=test['OPENAI_API_KEY'];env['OPENAI_BASE_URL']=test['OPENAI_BASE_URL']
    if env['OPENAI_BASE_URL']!='https://us.api.openai.com/v1':raise SystemExit('Expected US OpenAI endpoint')
    env['NODE_ENV']='production'
cmd=[str(root/'evaluation/runner/node_modules/.bin/tsx'),'--tsconfig',str(root/'web/tsconfig.json'),str(root/'evaluation/runner/runner.mts'),*sys.argv[1:]]
raise SystemExit(subprocess.run(cmd,env=env,cwd=root).returncode)
