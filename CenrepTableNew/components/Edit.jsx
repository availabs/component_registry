import React, {useEffect, useState} from "react";
import get from "lodash/get.js";
import VersionSelectorSearchable from "../../shared/versionSelector/searchable.jsx";
import {RenderFilters} from "./RenderFilters.jsx";
import {RenderSwitch} from "./RenderSwitch.jsx";
import {RenderColumnControls} from "../../shared/columnControls.jsx";
import {RenderBuildingsTable} from "./RenderBuildingsTable.jsx";
import {useFalcor} from '~/modules/avl-falcor';
import {isJson} from "../../utils/macros.jsx";
import {getData} from "../utils/getData.js";
import {isValid} from "../utils/isValid.js";
import {pgEnv} from "../../utils";
import {Loading} from "../../utils/loading.jsx";
import FilterableSearch from "../../shared/FilterableSearch.jsx";

export const EditComp = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [filters, setFilters] = useState(cachedData?.filters || {});
    const [filterValue, setFilterValue] = useState(cachedData?.filterValue || {});
    const [formatFn, setFormatFn] = useState(cachedData?.formatFn || {});
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [pageSize, setPageSize] = useState(cachedData?.pageSize || 5);
    const [dataSize, setDataSize] = useState(cachedData?.dataSize || 100);
    const [sortBy, setSortBy] = useState(cachedData?.sortBy || {});
    const [groupBy, setGroupBy] = useState(cachedData?.groupBy || []);
    const [notNull, setNotNull] = useState(cachedData?.notNull || []);
    const [showTotal, setShowTotal] = useState(cachedData?.showTotal || []);
    const [fn, setFn] = useState(cachedData?.fn || []);
    const [hiddenCols, setHiddenCols] = useState(cachedData?.hiddenCols || []);
    const [colSizes, setColSizes] = useState(cachedData?.colSizes || {});
    const [extFilterCols, setExtFilterCols] = useState(cachedData?.extFilterCols || []);
    const [extFilterValues, setExtFilterValues] = useState(cachedData?.extFilterValues || {});
    const [openOutCols, setOpenOutCols] = useState(cachedData?.openOutCols || []);
    const [colJustify, setColJustify] = useState(cachedData?.colJustify || {});
    const [striped, setStriped] = useState(cachedData?.striped || false);
    const [extFiltersDefaultOpen, setExtFiltersDefaultOpen] = useState(cachedData?.extFiltersDefaultOpen || false);
    const [customColName, setCustomColName] = useState(cachedData?.customColName || {});
    const [linkCols, setLinkCols] = useState(cachedData?.linkCols || {});
    const [showCsvDownload, setShowCsvDownload] = useState(cachedData?.showCsvDownload || false);
    const [additionalVariables, setAdditionalVariables] = useState(cachedData?.additionalVariables || []); // on all state updates, update variables that this comp exports

    const category = 'Cenrep';
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];

    async function load(){
        if(dataSources && (!visibleCols?.length || !version || !dataSource)) {
            !dataSource && setStatus('Please select a Datasource.');
            !version && setStatus('Please select a version.');
            !visibleCols?.length && setStatus('Please select columns.');

            setLoading(false);
            return;
        }

        if(!isValid({groupBy, fn, columnsToFetch: visibleCols.map(vc => fn[vc] ? fn[vc] : vc)})){
            setStatus('Please make appropriate grouping selections.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setStatus(undefined);

        const tmpData = await getData({
            dataSources, dataSource, geoAttribute,
            pageSize, dataSize, sortBy, groupBy, fn, notNull, showTotal, colSizes,
            filters, filterValue, formatFn, visibleCols, hiddenCols,
            version, extFilterCols, extFilterValues, openOutCols, colJustify, striped, extFiltersDefaultOpen,
            customColName, linkCols,
            data, columns, showCsvDownload, additionalVariables, fetchData: true
        }, falcor);

        onChange(JSON.stringify({
            // only save data and columns
            ...tmpData,
        }));

        setLoading(false);

    }

    useEffect(() => {
        async function getDataSources() {
            setLoading(true);
            setStatus(undefined);

            // fetch data sources from categories that match passed prop
            await falcor.get(dataSourceByCategoryPath);
            setDataSources(get(falcor.getCache(), [...dataSourceByCategoryPath, 'value'], []))

            setLoading(false);

        }

        getDataSources()
    }, []);

    useEffect(() => {
        const geoAttribute =
            (dataSources
                .find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                .find(c => c.display === 'geoid-variable')?.name

        const geoAttributeMapped = geoAttribute?.includes(' AS') ? geoAttribute.split(' AS')[0] :
            geoAttribute?.includes(' as') ? geoAttribute.split(' as')[0] : geoAttribute;

        geoAttributeMapped && setGeoAttribute(geoAttributeMapped);
    }, [dataSource]);

    useEffect(() => {
        async function load(){
            setLoading(true);
            setStatus(undefined);

            // getData that only sets settings, but doesn't fetch data.
            const tmpData = await getData({
                dataSources, dataSource, geoAttribute,
                pageSize, dataSize, sortBy, groupBy, fn, notNull, showTotal, colSizes,
                filters, filterValue, formatFn, visibleCols, hiddenCols,
                version, extFilterCols, extFilterValues, openOutCols, colJustify, striped, extFiltersDefaultOpen,
                customColName, linkCols,
                data, columns, showCsvDownload, additionalVariables,
                fetchData: false
            }, falcor);

            onChange(JSON.stringify({
                // only save data and columns
                ...tmpData,
            }));

            setLoading(false);
        }

        load()

    }, [
        pageSize, dataSize, sortBy, colSizes,
        filters, filterValue, hiddenCols, formatFn,
        extFilterCols, extFilterValues, colJustify, striped,
        extFiltersDefaultOpen, customColName, linkCols, showCsvDownload
    ]);

    const data = cachedData.data;

    const attributionData = cachedData.attributionData;

    const columns = cachedData.columns;

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <FilterableSearch
                        className={'flex-row-reverse p-0'}
                        label={'Data Source:'}
                        options={dataSources.map(ds => ({label: ds.name, key: ds.source_id})).sort((a,b) => a.label.localeCompare(b.label))}
                        value={dataSource}
                        onChange={(value) => {
                            setVisibleCols([])
                            setExtFilterCols([]);
                            setGeoAttribute(undefined)
                            setDataSource(+value);
                        }}
                        placeholder={'Please select a data source'}
                    />
                    <VersionSelectorSearchable
                        source_id={dataSource}
                        view_id={version}
                        onChange={setVersion}
                        className={'flex-row-reverse'}
                    />

                    <RenderFilters
                        falcor={falcor}
                        pgEnv={pgEnv}
                        version={version}
                        filters={additionalVariables}
                        setFilters={setAdditionalVariables}
                        columns={
                            (dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                                .filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))}
                        metadata={dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || []}
                    />

                    <RenderSwitch label={'Striped'} value={striped} setValue={setStriped}/>
                    <RenderSwitch label={'External filters default open'} value={extFiltersDefaultOpen}
                                  setValue={setExtFiltersDefaultOpen}/>
                    <RenderSwitch label={'Show CSV Download'} value={showCsvDownload}
                                  setValue={setShowCsvDownload}/>

                    <RenderColumnControls
                        cols={
                            (dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                                .filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))
                                .map(c => c.name)
                        }
                        metadata={dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || []}
                        // anchorCols={anchorCols}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        hiddenCols={hiddenCols}
                        setHiddenCols={setHiddenCols}
                        filters={filters}
                        setFilters={setFilters}
                        filterValue={filterValue}
                        setFilterValue={setFilterValue}
                        formatFn={formatFn}
                        setFormatFn={setFormatFn}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        dataSize={dataSize}
                        setDataSize={setDataSize}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                        fn={fn}
                        setFn={setFn}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        notNull={notNull}
                        setNotNull={setNotNull}
                        showTotal={showTotal}
                        setShowTotal={setShowTotal}
                        colSizes={colSizes}
                        setColSizes={setColSizes}
                        extFilterCols={extFilterCols}
                        setExtFilterCols={setExtFilterCols}
                        openOutCols={openOutCols}
                        setOpenOutCols={setOpenOutCols}
                        colJustify={colJustify}
                        setColJustify={setColJustify}
                        customColName={customColName}
                        setCustomColName={setCustomColName}
                        linkCols={linkCols}
                        setLinkCols={setLinkCols}
                    />

                    <div className={'flex justify-end'}>
                        <button
                            className={'bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-fit sm:flex-end rounded-md p-1.5 transition ease-in-out'}
                            onClick={() => load()}
                        >Generate
                        </button>
                    </div>
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <RenderBuildingsTable
                                data={data}
                                columns={columns}
                                hiddenCols={hiddenCols}
                                filterValue={filterValue}
                                extFilterValues={extFilterValues}
                                setExtFilterValues={setExtFilterValues}
                                extFiltersDefaultOpen={extFiltersDefaultOpen}
                                pageSize={pageSize}
                                sortBy={sortBy}
                                attributionData={attributionData}
                                striped={striped}
                                showCsvDownload={showCsvDownload}
                                baseUrl={baseUrl}
                                // fetchData={fetchData}
                            />

                }
            </div>
        </div>
    )
}

EditComp.settings = {
    hasControls: true,
    name: 'ElementEdit'
}