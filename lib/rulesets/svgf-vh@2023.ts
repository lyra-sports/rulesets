import { type Ruleset } from '../index.js'

import svgfVhFreestyle2023 from '../models/competition-events/svgf-vh.freestyle@2023.js'
import svgfVhSpeed2023 from '../models/competition-events/svgf-vh.speed@2023.js'
import svgfVhTiming2023 from '../models/competition-events/svgf-vh.timing@2023.js'
import svgfVhOverall2023 from '../models/overalls/svgf-vh.overall@2023.js'

import eSvgfFsDdDdpfVh41202023 from '../preconfigured/competition-events/svgf/2023/e.svgf.fs.dd.ddpf-vh.4.120@2023.js'
import eSvgfFsSrSrifVh1752023 from '../preconfigured/competition-events/svgf/2023/e.svgf.fs.sr.srif-vh.1.75@2023.js'
import eSvgfFsSrSrtfVh4752023 from '../preconfigured/competition-events/svgf/2023/e.svgf.fs.sr.srtf-vh.4.75@2023.js'
import eSvgfSpDdDdsr42x452023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.dd.ddsr.4.2x45@2023.js'
import eSvgfSpDdDdut402023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.dd.ddut.4.0@2023.js'
import eSvgfSpSrSrdr44x302023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srdr.4.4x30@2023.js'
import eSvgfSpSrSrdu1302023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srdu.1.30@2023.js'
import eSvgfSpSrSrse11202023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srse.1.120@2023.js'
import eSvgfSpSrSrsr44x302023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srsr.4.4x30@2023.js'
import eSvgfSpSrSrss1302023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srss.1.30@2023.js'
import eSvgfOaDdVhto402023 from '../preconfigured/overalls/svgf/2023/e.svgf.oa.dd.vhto.4.0@2023.js'
import eSvgfOaSrVhio102023 from '../preconfigured/overalls/svgf/2023/e.svgf.oa.sr.vhio.1.0@2023.js'
import eSvgfOaSrVhto402023 from '../preconfigured/overalls/svgf/2023/e.svgf.oa.sr.vhto.4.0@2023.js'
import eSvgfFsSrSrpfVh2752023 from '../preconfigured/competition-events/svgf/2023/e.svgf.fs.sr.srpf-vh.2.75@2023.js'
import eSvgfSpSrSrdp22x302023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srdp.2.2x30@2023.js'
import eSvgfSpSrSrpe22x602023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srpe.2.2x60@2023.js'
import eSvgfSpSrSrps22x302023 from '../preconfigured/competition-events/svgf/2023/e.svgf.sp.sr.srps.2.2x30@2023.js'
import eSvgfOaSrVhpo202023 from '../preconfigured/overalls/svgf/2023/e.svgf.oa.sr.vhpo.2.0@2023.js'

export default {
  id: 'svgf-vh@2023',
  name: 'SvGF Vikingahoppet 2023',
  competitionEvents: [
    eSvgfSpSrSrss1302023,
    eSvgfSpSrSrdu1302023,
    eSvgfSpSrSrse11202023,
    eSvgfFsSrSrifVh1752023,

    eSvgfSpSrSrsr44x302023,
    eSvgfSpSrSrdr44x302023,
    eSvgfFsSrSrtfVh4752023,

    eSvgfSpDdDdsr42x452023,
    eSvgfSpDdDdut402023,
    eSvgfFsDdDdpfVh41202023,

    eSvgfSpSrSrps22x302023,
    eSvgfSpSrSrpe22x602023,
    eSvgfSpSrSrdp22x302023,
    eSvgfFsSrSrpfVh2752023,
  ],
  overalls: [
    eSvgfOaSrVhio102023,
    eSvgfOaSrVhto402023,
    eSvgfOaDdVhto402023,
    eSvgfOaSrVhpo202023,
  ],
  competitionEventModels: [
    svgfVhFreestyle2023,
    svgfVhSpeed2023,
    svgfVhTiming2023,
  ],
  overallModels: [
    svgfVhOverall2023,
  ],
} satisfies Ruleset
