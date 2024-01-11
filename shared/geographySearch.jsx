import {AsyncTypeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import { Link, useNavigate } from "react-router-dom";
import get from "lodash/get";
import { useEffect, useState } from "react";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils/";



const handleSearch = (text, selected, setSelected) => {
  if(selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, value, geoData, navigate, onChange) => {
  const geoid = get(selected, [0, 'geoid']);
  if(geoid || geoid === ''){
    setSelected(selected);
    onChange ? onChange(geoid) : navigate(`/geoid//${geoid}`)
  }else{
    setSelected([])
  }
}
const menuItemsLinks = (option) => {
  return <Link key={option.geoid} className="block hover:bg-slate-200 text-xl tracking-wide" to={`/geography/${option.geoid}`}>{option.name}</Link>;
}
const menuItemsList = (option) => (
    <span className={"block hover:bg-slate-200 text-xl tracking-wide"}>{option.name}</span>
)

const renderMenu = (results, menuProps, labelKey, ...props) => {
  return (
      <Menu className={'bg-slate-100  overflow-hidden z-10'} {...menuProps}>
        {results.map((result, index) => (
            <MenuItem className={"block hover:bg-slate-200 text-xl tracking-wide pl-1"} option={result} position={index}>
              {result.name}
            </MenuItem>
        ))}
        {/*{results.map((result, idx) => menuItemsLinks(result))}*/}
      </Menu>
  )
};

const getStateData = async ({ falcor, pgEnv }) => {
  const stateViewId = 285

  const geoAttributes = ['geoid', 'stusps', 'name'],
        geoOptions = JSON.stringify({}),
        geoRoute = ['dama', pgEnv, 'viewsbyId', stateViewId, 'options', geoOptions]
  const lenRes = await falcor.get([...geoRoute, 'length']);
  const len = get(lenRes, ['json', ...geoRoute, 'length']);
  if(len > 0){
    const geoRouteIndices = {from: 0, to:  len - 1}
    const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);
    return Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}));
  }
}
const getCountyData = async ({ falcor, pgEnv, statesData, setGeoData }) => {
  const countyViewId = 286

  const geoAttributesMapping = {'geoid': 'geoid', 'name': 'namelsad as name'},
        geoAttributes = Object.values(geoAttributesMapping),
        geoOptions = JSON.stringify({}),
        geoRoute = ['dama', pgEnv, 'viewsbyId', countyViewId, 'options', geoOptions]

  const lenRes = await falcor.get([...geoRoute, 'length']);
  const len = get(lenRes, ['json', ...geoRoute, 'length']);

  if(len > 0){
    const geoRouteIndices = {from: 0, to:  len - 1}
    const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);

    const geoData = Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}))
      .filter(county => county.geoid)
      .map(county => {
        const state = get(statesData.find(sd => sd.geoid === county.geoid.substring(0, 2)), 'stusps', '');
        return {geoid: county.geoid, name: `${county[geoAttributesMapping.name]}, ${state}`};
      })

    geoData.push(...statesData.map(sd => ({geoid: sd.geoid, name: `${sd.name} State`})))
    setGeoData(geoData)
  }
}

export default ({
                         className,
                         value,
                         onChange // if not passed, navigate to geography page
}) => {
  const navigate = useNavigate();
  const { falcor, falcorCache } = useFalcor();
  const [geoData, setGeoData] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect( () => {
    async function getData(){
      const statesData = await getStateData({ falcor, pgEnv });
      await getCountyData({ falcor, pgEnv, statesData, setGeoData });
    }

    getData();
  }, [pgEnv, falcor]);

  useEffect(() => {
    setSelected(geoData.filter(gd => value && gd.geoid === value))
  }, [geoData, value]);

  return (
      <div className={'flex flex-row flex-wrap justify-between'}>
        <label className={'shrink-0 pr-2 py-1 my-1 w-1/4'}>Geography:</label>
        <div className={`flex flex row ${className} w-3/4 shrink my-1`}>
          <i className={`fa fa-search font-light text-xl bg-white pr-2 pt-1 rounded-r-md`} />
          <AsyncTypeahead
              className={'w-full'}
              isLoading={false}
              onSearch={handleSearch}
              minLength = {2}
              id="geography-search"
              key="geography-search"
              placeholder="Search for a Geography..."
              options={geoData}
              labelKey={(option) => `${option.name}`}
              defaultSelected={ selected }
              onChange = {(selected) => onChangeFilter(selected, setSelected, value, geoData, navigate, onChange)}
              selected={ selected }
              inputProps={{ className: 'bg-white  w-full p-1 pl-3 rounded-l-md' }}
              renderMenu={renderMenu}
          />
        </div>
      </div>
  )
}