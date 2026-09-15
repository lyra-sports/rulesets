import { type Ruleset } from './types.js'

import ijruSpeed100 from '../models/competition-events/ijru.speed@1.0.0.js'
import ijruFreestyleSr420 from '../models/competition-events/ijru.freestyle.sr@4.2.0.js'
import ijruFreestyleWh400 from '../models/competition-events/ijru.freestyle.wh@4.0.0.js'
import ijruFreestyleDd400 from '../models/competition-events/ijru.freestyle.dd@4.0.0.js'
import ijruFreestyleShow500 from '../models/competition-events/ijru.freestyle.show@5.0.0.js'
import ijruOverall100 from '../models/overalls/ijru.overall@1.0.0.js'

import eIjruSpDdDdsr44x30100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.dd.ddsr.4.4x30@1.0.0.js'
import eIjruSpDdDdss360100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.dd.ddss.3.60@1.0.0.js'
import eIjruSpSrSrdr22x30100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srdr.2.2x30@1.0.0.js'
import eIjruSpSrSrse1180100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srse.1.180@1.0.0.js'
import eIjruSpSrSrsr44x30100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srsr.4.4x30@1.0.0.js'
import eIjruSpSrSrss130100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srss.1.30@1.0.0.js'
import eIjruSpSrSrtu10100 from '../preconfigured/competition-events/ijru/1.0.0/e.ijru.sp.sr.srtu.1.0@1.0.0.js'
import eIjruFsSrSrif175420 from '../preconfigured/competition-events/ijru/4.2.0/e.ijru.fs.sr.srif.1.75@4.2.0.js'
import eIjruFsSrSrpf275420 from '../preconfigured/competition-events/ijru/4.2.0/e.ijru.fs.sr.srpf.2.75@4.2.0.js'
import eIjruFsSrSrtf475420 from '../preconfigured/competition-events/ijru/4.2.0/e.ijru.fs.sr.srtf.4.75@4.2.0.js'
import eIjruFsDdDdsf375400 from '../preconfigured/competition-events/ijru/4.0.0/e.ijru.fs.dd.ddsf.3.75@4.0.0.js'
import eIjruFsDdDdpf475400 from '../preconfigured/competition-events/ijru/4.0.0/e.ijru.fs.dd.ddpf.4.75@4.0.0.js'
import eIjruFsWhWhpf275400 from '../preconfigured/competition-events/ijru/4.0.0/e.ijru.fs.wh.whpf.2.75@4.0.0.js'
import eIjruFsTsSctf8300 from '../preconfigured/competition-events/ijru/5.0.0/e.ijru.fs.ts.sctf.8.300@5.0.0.js'
import eIjruOaSrIsro10400 from '../preconfigured/overalls/ijru/4.0.0/e.ijru.oa.sr.isro.1.0@4.0.0.js'
import eIjruOaXdTxdo40400 from '../preconfigured/overalls/ijru/4.0.0/e.ijru.oa.xd.txdo.4.0@4.0.0.js'

export default {
  id: 'ijru@5.0.0',
  name: 'IJRU v5.0.0',
  competitionEvents: [
    eIjruSpSrSrss130100,
    eIjruSpSrSrse1180100,
    eIjruSpSrSrtu10100,
    eIjruFsSrSrif175420,

    eIjruSpSrSrsr44x30100,
    eIjruSpSrSrdr22x30100,
    eIjruSpDdDdsr44x30100,
    eIjruSpDdDdss360100,

    eIjruFsSrSrpf275420,
    eIjruFsSrSrtf475420,
    eIjruFsDdDdsf375400,
    eIjruFsDdDdpf475400,
    eIjruFsWhWhpf275400,

    eIjruFsTsSctf8300,

    // TODO: DDC
  ],
  overalls: [
    eIjruOaSrIsro10400,
    eIjruOaXdTxdo40400,
  ],
  competitionEventModels: [
    ijruFreestyleSr420,
    ijruFreestyleWh400,
    ijruFreestyleDd400,
    ijruFreestyleShow500,
    ijruSpeed100,
  ],
  overallModels: [
    ijruOverall100,
  ],
} satisfies Ruleset
