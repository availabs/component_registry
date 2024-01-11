import get from "lodash/get.js";
import {metaData} from "./config.js";
import {hazardsMeta} from "~/utils/colors.jsx";

export const setChoroplethData = async ({
    falcor,
    choroplethPath,
    attributionPath,
    choroplethAttributes,
    typeId,
    setLoading,
    setData

}) => {
    const geomRes = await falcor.get(
        [...choroplethPath(typeId.view_id), 'length'],
        attributionPath(typeId.view_id)
    );

    const len = get(geomRes, ['json', ...choroplethPath(typeId.view_id), 'length']);

    if (!len) return Promise.resolve();

    const res = await falcor.get([...choroplethPath(typeId.view_id), 'databyIndex', {
        from: 0,
        to: len - 1
    }, Object.values(choroplethAttributes)]);

    let data = Object.values(get(res, ['json', ...choroplethPath(typeId.view_id), 'databyIndex'], {}));
    data = [...Array(len).keys()].map(i => {
        return Object.keys(choroplethAttributes).reduce((acc, curr) => ({
            ...acc,
            [curr]: data[i][choroplethAttributes[curr]]
        }), {});
    });

    if (!data?.length) {
        setLoading(false)
        return Promise.resolve();
    }

    setData(data);
}

export const setCirclesData = async ({
                                         falcor,
                                         eventMagnitudePath,
                                         attributionPath,
                                         circlesPath,
                                         countyCentroidPath,
                                         countyCentroidOptions,
                                         countyCentroidAttributes,
                                         eventMagnitudeAttributes,
                                         circlesOptions,
                                         circlesAttributes,
                                         typeId,
                                         nceiEView,
                                         countyView,
                                         setLoading,
                                         setData,
                                         attribute

                                     }) => {
    const geomRes = await falcor.get(
        [...eventMagnitudePath(typeId.view_id), 'length'],
        attributionPath(typeId.view_id)
    );

    const len = get(geomRes, ['json', ...eventMagnitudePath(typeId.view_id), 'length']);

    if (!len) {
        setLoading(false)
        return Promise.resolve();
    }

    const res = await falcor.get([...eventMagnitudePath(typeId.view_id), 'databyIndex', {
        from: 0,
        to: len - 1
    }, Object.values(eventMagnitudeAttributes)]);

    let data = Object.values(get(res, ['json', ...eventMagnitudePath(typeId.view_id), 'databyIndex'], {}));
    data = [...Array(len).keys()].map(i => {
        return Object.keys(eventMagnitudeAttributes).reduce((acc, curr) => ({
            ...acc,
            [curr]: data[i][eventMagnitudeAttributes[curr]]
        }), {});
    });

    if (!data?.length) {
        setLoading(false)
        return Promise.resolve();
    }

    const event_ids = data.map(d => d.event_id);

    await falcor.get([...circlesPath(nceiEView.view_id), circlesOptions(event_ids),
        'databyIndex', {from: 0, to: event_ids.length - 1}, Object.values(circlesAttributes)]);

    let points = Object.values(get(falcor.getCache(),
        [
            ...circlesPath(nceiEView.view_id),
            circlesOptions(event_ids),
            'databyIndex'],
        {}));

    const geoids = [
        ...new Set(
           [
               ...points.filter(p => p.begin_lat === 0).map(p => p['substring(geoid, 1, 5) as geoid']),
               ...data.filter(d => !d.event_id).map(p => p.geoid)
           ]
        )
    ];

    const magnitudeLocationData = [] // {[{event_id: 123, magnitude: 1, location: POINT}]}

    // events with geom
    points.filter(p => p.begin_lat !== 0)
        .forEach(({
                      event_id,
                      'ST_AsGeoJson(ST_setSrid(ST_MakePoint(begin_lon, begin_lat), 4326)) as point': location, ...rest
                  }) => {

            const magnitude = data.find(d => d.event_id === event_id)?.[metaData.fusion.columns[attribute]];
            const nri_category = data.find(cc => cc.event_id === event_id)?.['nri_category'];

            magnitudeLocationData.push({event_id, location, magnitude, color: hazardsMeta[nri_category]?.color})
        })

    if (geoids.length) {
        await falcor.get(
            [
                ...countyCentroidPath(countyView.view_id),
                countyCentroidOptions(geoids),
                'databyIndex',
                {from: 0, to: geoids.length - 1},
                Object.values(countyCentroidAttributes)
            ]
        )

        const countyCentroids = Object.values(get(
            falcor.getCache(),
            [
                ...countyCentroidPath(countyView.view_id),
                countyCentroidOptions(geoids),
                'databyIndex',
            ],
            {}
        ));

        // events without geom
        points.filter(p => p.begin_lat === 0)
            .forEach(({event_id, 'substring(geoid, 1, 5) as geoid': geoid}) => {
                const location =
                    countyCentroids
                        .find(cc => cc.geoid === geoid)?.[countyCentroidAttributes.centroid];
                const nri_category = data.find(cc => cc.event_id === event_id)?.['nri_category'];

                const magnitude = data.find(d => d.event_id === event_id)?.[metaData.fusion.columns[attribute]];

                location && magnitudeLocationData.push({
                    event_id,
                    location,
                    magnitude,
                    color: hazardsMeta[nri_category]?.color
                })
            })

        // manually inserted FEMA events without event_id
        data.filter(d => !d.event_id)
            .forEach(({geoid, nri_category, ...rest}) => {
                const location =
                    countyCentroids
                        .find(cc => cc.geoid === geoid)?.[countyCentroidAttributes.centroid];
                const magnitude = rest[metaData.fusion.columns[attribute]];

                location && magnitudeLocationData.push({
                    event_id:`${geoid} FEMA Event (No NCEI match)`,
                    location,
                    magnitude,
                    color: hazardsMeta[nri_category]?.color
                })
            })
    }

    setData(magnitudeLocationData)

}

export const handleMapFocus = async ({geoid, data, pgEnv, falcor, stateView, setMapfocus}) => {
    const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
        geoIndices = {from: 0, to: 0},
        stateFips = get(data, [0, 'geoid']) || geoid?.substring(0, 2),
        geoPath = ({view_id}) =>
            ['dama', pgEnv, 'viewsbyId', view_id,
                'options', JSON.stringify({filter: {geoid: [false && geoid?.toString()?.length === 5 ? geoid : stateFips.substring(0, 2)]}}),
                'databyIndex'
            ];
    const geomRes = await falcor.get([...geoPath(stateView), geoIndices, geomColTransform]);
    const geom = get(geomRes, ["json", ...geoPath(stateView), 0, geomColTransform]);
    if (geom) {
        setMapfocus(get(JSON.parse(geom), 'bbox'));
    }
}