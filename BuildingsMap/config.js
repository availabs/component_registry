export const metaData = {
    title: function (hazard, attribute, consequence){
        const conseq = Object.keys(this.consequences).find(k => this.consequences[k] === consequence);
        const attr = Object.keys(this.attributes).find(k => this.attributes[k] === attribute);
        return `NRI ${hazard} ${conseq || ``} ${attr}`
    },
    type: 'nri',
    attributes: {
        'Frequency (yearly)': 'afreq',
        Exposure: 'exp',
        EAL: 'eal'
    },
    consequences: {
        Property: 'b',
        Crop: 'a',
        Population: 'p',
        'Population $': 'pe',
        Total: 't'
    },
    dataSources: [
        {label: 'NRI Counties', value: 'nri', geoLayer: 'counties', geomCol: 'stcofips', geomView: 285},
        {label: 'NRI Census Tracts', value: 'nri_tracts', geoLayer: 'tracts', geomCol: 'tractfips', geomView: 285},
        {label: 'AVAIL EAL', value: 'avail_counties', geoLayer: 'counties', geomCol: 'stcofips', geomView: 285}
    ]
};