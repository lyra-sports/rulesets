import { writeFileSync } from 'node:fs'
import path from 'node:path'

writeFileSync(path.resolve(__dirname, '../dist/esm/package.json'), JSON.stringify({ type: 'module' }) + '\n')
writeFileSync(path.resolve(__dirname, '../dist/cjs/package.json'), JSON.stringify({ type: 'commonjs' }) + '\n')
