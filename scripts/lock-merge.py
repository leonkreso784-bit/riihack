# Nova ovisnost bez kvarenja locka na Windowsu.
# `npm install … --package-lock-only` na Windowsu premjesti @emnapi/* pod @tailwindcss/oxide-wasm32-wasi, pa `npm ci`
# na Linuxu (CI, Vercel) padne („Missing: @emnapi/core … from lock file", vidi 998f2dc i #139).
# Postupak:
#   1. npm install <paket>@<verzija> --save-exact --package-lock-only
#   2. git show origin/main:package-lock.json > ../orig.json
#   3. python scripts/lock-merge.py ../orig.json package-lock.json package-lock.json && rm ../orig.json
#   4. git diff origin/main -- package-lock.json  → samo dodani redci (korijen "" i novi paketi)
# Zadrži izvorni lock; iz generiranog uzme samo korijenski unos "" i pakete kojih prije nije bilo.
import json, sys
orig_p, gen_p, out_p = sys.argv[1:4]
raw = open(orig_p, 'rb').read()
nl = b'\r\n' if b'\r\n' in raw else b'\n'
orig = json.loads(raw); gen = json.load(open(gen_p, encoding='utf-8'))
op, gp = orig['packages'], gen['packages']
new = {k: v for k, v in gp.items() if k not in op and '@tailwindcss/oxide-wasm32-wasi/node_modules' not in k}
merged = dict(op); merged[''] = gp['']; merged.update(new)
orig['packages'] = {'': merged['']} | {k: merged[k] for k in sorted(k for k in merged if k)}
text = json.dumps(orig, indent=2, ensure_ascii=False) + '\n'
open(out_p, 'wb').write(text.encode('utf-8').replace(b'\n', nl))
print('added', sorted(new))
