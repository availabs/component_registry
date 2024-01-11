import SocialWelfare from './socialWelfare.js'
import Education from './education.js'
import Overview from './overview.js'
import Housing from './housing.js'
import Economy from "./economy.js"
import Health from "./health.js"
import Transportation from "./transportation.js"
import covid19 from "./covid19.js"

import Links from "./links.js"

const CONFIG = {
  // 'COVID-19': covid19,
  Overview,
  Economy,
  'Social Welfare': SocialWelfare,
  Health,
  Education,
  Housing,
  Transportation,
  Links
}
export default Object.keys(CONFIG)
  .reduce((a, c, i) => {
    a[c] = CONFIG[c].map((config, ii) => {
      config.graphId = `${ c }-${ ii }`;
      config.id = config.id || `local-profile-${ config.type }-${ config.title || config.broadCensusKey || config.header }`;
      config.id = config.id.replace(/\s/g, "_");
      return config;
    })
    return a;
  }, {})
