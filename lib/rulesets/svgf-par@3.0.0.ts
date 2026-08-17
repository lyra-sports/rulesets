import { type Ruleset } from '../index.js'

import ijruSpeed100 from '../models/competition-events/ijru.speed@1.0.0.js'
import svgfFreestyle300 from '../models/competition-events/svgf.freestyle@3.0.0.js'
import svgfParOverall200 from '../models/overalls/svgf-par.overall@2.0.0.js'

import eIjruSpSrSrdr22x30100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srdr.2.2x30@1.0.0.js'
import eSvgfSpSrSrpe22x90200 from '../preconfigured/competition-events/svgf/2.0.0/e.svgf.sp.sr.srpe.2.2x90@2.0.0.js'
import eSvgfSpSrSrps22x30200 from '../preconfigured/competition-events/svgf/2.0.0/e.svgf.sp.sr.srps.2.2x30@2.0.0.js'
import eSvgfFsSrSrpf275300 from '../preconfigured/competition-events/svgf/3.0.0/e.svgf.fs.sr.srpf.2.75@3.0.0.js'
import eSvgfFsSrSrtf475300 from '../preconfigured/competition-events/svgf/3.0.0/e.svgf.fs.sr.srtf.4.75@3.0.0.js'
import eSvgfFsWhWhpf275300 from '../preconfigured/competition-events/svgf/3.0.0/e.svgf.fs.wh.whpf.2.75@3.0.0.js'
import eSvgfOaXdTpaa20300 from '../preconfigured/overalls/svgf/3.0.0/e.svgf.oa.xd.tpaa.2.0@3.0.0.js'

export default {
  id: 'svgf-par@3.0.0',
  name: 'SvGF Pair (IJRU v3+v4) v3.0.0',
  competitionEvents: [
    eSvgfSpSrSrps22x30200,
    eSvgfSpSrSrpe22x90200,
    eIjruSpSrSrdr22x30100,
    eSvgfFsSrSrpf275300,
    eSvgfFsSrSrtf475300,
    eSvgfFsWhWhpf275300,
  ],
  overalls: [
    eSvgfOaXdTpaa20300,
  ],
  competitionEventModels: [
    ijruSpeed100,
    svgfFreestyle300,
  ],
  overallModels: [
    svgfParOverall200,
  ],
} satisfies Ruleset
