import { type Ruleset } from '../index.js'

import ijruFreestyle200 from '../models/competition-events/ijru.freestyle@2.0.0.js'
import ijruSpeed100 from '../models/competition-events/ijru.speed@1.0.0.js'
import svgfParOverall200 from '../models/overalls/svgf-par.overall@2.0.0.js'

import eIjruFsSrSrpf275200 from '../preconfigured/competition-events/ijru/2.0.0/e.ijru.fs.sr.srpf.2.75@2.0.0.js'
import eIjruFsWhWhpf275200 from '../preconfigured/competition-events/ijru/2.0.0/e.ijru.fs.wh.whpf.2.75@2.0.0.js'
import eIjruSpSrSrdr22x30100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srdr.2.2x30@1.0.0.js'
import eSvgfSpSrSrpe22x90200 from '../preconfigured/competition-events/svgf/2.0.0/e.svgf.sp.sr.srpe.2.2x90@2.0.0.js'
import eSvgfSpSrSrps22x30200 from '../preconfigured/competition-events/svgf/2.0.0/e.svgf.sp.sr.srps.2.2x30@2.0.0.js'
import eSvgfOaXdTpaa20200 from '../preconfigured/overalls/svgf/2.0.0/e.svgf.oa.xd.tpaa.2.0@2.0.0.js'

export default {
  id: 'svgf-par@2.0.0',
  name: 'SvGF Pair (IJRU-based) v2.0.0',
  competitionEvents: [
    eSvgfSpSrSrps22x30200,
    eSvgfSpSrSrpe22x90200,
    eIjruSpSrSrdr22x30100,
    eIjruFsSrSrpf275200,
    eIjruFsWhWhpf275200,
  ],
  overalls: [
    eSvgfOaXdTpaa20200,
  ],
  competitionEventModels: [
    ijruFreestyle200,
    ijruSpeed100,
  ],
  overallModels: [
    svgfParOverall200,
  ],
} satisfies Ruleset
