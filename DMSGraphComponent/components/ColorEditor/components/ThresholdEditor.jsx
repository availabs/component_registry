import React from "react"

import {
  extent as d3extent,
  mean as d3mean,
  median as d3median,
  range as d3range
} from "d3-array"
import { format as d3format } from "d3-format"

import { Button } from "../../uicomponents"

const intFormat = d3format(",d");
const floatFormat = d3format(",.2f");

const ValueRow = ({ label, children }) => {
  return (
    <div className="flex py-2 items-center">
      { !label ? null :
        <div className="w-20 text-right font-bold">{ label }</div>
      }
      <div className="flex-1 text-right">
        { children }
      </div>
    </div>
  )
}

const generateThresholds = (dataDomain, num) => {
  const [min, max] = d3extent(dataDomain);
  const diff = max - min;
  const step = Math.round(diff / (num + 1));
  return d3range(num + 1).reduce((a, c) => {
    if (!a.length) {
      a.push(min + step);
    }
    else if (a.length === num) {
      return a;
    }
    else {
      const prev = a[a.length - 1];
      a.push(prev + step);
    }
    return a;
  }, []);
}

export const ThresholdEditor = ({ dataDomain, domain, range, edit, children, type }) => {

  const [current, setCurrent] = React.useState([]);

  React.useEffect(() => {
    if ((type === "threshold") && dataDomain.length && (current.length !== (range.length + 1))) {
      const domain = generateThresholds(dataDomain, range.length - 1);
      edit(domain);
      setCurrent([...domain]);
    }
  }, [dataDomain, range.length, edit, type]);

  const editDomainItem = React.useCallback((value, index) => {
    setCurrent(current => {
      const update = [...current];
      update[index] = value;
      return update.sort((a, b) => a - b);
    })
  }, []);

  const addNewDomainItem = React.useCallback(e => {
    setCurrent(current => [...current, 0]);
  }, []);

  const removeDomainItem = React.useCallback(value => {
    setCurrent(current => current.filter(v => v !== value));
  }, []);

  const okToSave = React.useMemo(() => {
    return ((current.length + 1) === range.length) && !isEqual(current, domain);
  }, [range, current]);

  const saveThresholds = React.useCallback(e => {
    if (!okToSave) return;
    edit([...current]);
  }, [edit, okToSave, current]);

  const resetThresholds = React.useCallback(e => {
    setCurrent(generateThresholds(dataDomain, range.length - 1));
  }, [dataDomain, range]);

  const { count, min, max, mean, median } = React.useMemo(() => {
    const [min, max] = d3extent(dataDomain);
    return {
      count: intFormat(dataDomain.length),
      min: floatFormat(min),
      max: floatFormat(max),
      mean: floatFormat(d3mean(dataDomain)),
      median: floatFormat(d3median(dataDomain))
    }
  }, [dataDomain]);

  return (
    <div className={ `
        px-6 py-2 relative h-full relative
      ` }
    >

      { children }

      <div className="font-bold text-xl">
        Threshold Editor
      </div>

      <div className="grid grid-cols-2 gap-8">

        <div>
          <div className="font-bold border-b-2 border-current">
            Data Statistics:
          </div>
          <pre>
            <ValueRow label="Count:">{ count }&nbsp;&nbsp;&nbsp;</ValueRow>
            <ValueRow label="Minimum:">{ min }</ValueRow>
            <ValueRow label="Mean:">{ mean }</ValueRow>
            <ValueRow label="Median:">{ median }</ValueRow>
            <ValueRow label="Maximum:">{ max }</ValueRow>
          </pre>
        </div>

        <div>
          <div className="font-bold border-b-2 border-current">
            Current Thresholds:
          </div>
          <pre>
            { current.map((v, i) => (
                <ValueRow key={ v }>
                  <DomainItem
                    value={ v }
                    index={ i }
                    edit={ editDomainItem }
                    remove={ removeDomainItem }/>
                </ValueRow>
              ))
            }
            <ValueRow>
              <span className="fa fa-plus hover:text-green-500 cursor-pointer"
                onClick={ addNewDomainItem }/>
            </ValueRow>
          </pre>
        </div>

        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-8 px-6 pb-8">
          <Button onClick={ resetThresholds }>
            Reset Thresholds
          </Button>

          <Button onClick={ saveThresholds }
            disabled={ !okToSave }
          >
            Save Thresholds
          </Button>
        </div>

      </div>
    </div>
  )
}

const DomainItem = ({ value, index, remove, edit }) => {

  const doRemove = React.useCallback(e => {
    remove(value);
  }, [remove, value]);

  const [editMode, setEditMode] = React.useState(false);
  const [editValue, _setEditValue] = React.useState("");
  const setEditValue = React.useCallback(e => {
    _setEditValue(e.target.value);
  }, []);

  const enterEditMode = React.useCallback(e => {
    setEditMode(true);
    _setEditValue(String(value));
  }, [value]);

  const doEdit = React.useCallback(e => {
    edit(+editValue, index);
    setEditMode(false);
    _setEditValue("");
  }, [edit, index, editValue]);

  React.useEffect(() => {
    if (value === 0) {
      setEditMode(true);
    }
  }, [value]);

  return (
    <>
      { !editMode ?
        intFormat(value) :
        <input value={ editValue }
          onChange={ setEditValue }
          className="px-2 py-1 text-right"
          style={ { outline: "none", border: "none" } }/>
      }
      { !editMode ?
        <span className="ml-4 fa fa-edit hover:text-blue-600 cursor-pointer"
          onClick={ enterEditMode }/> :
        <span className="ml-4 fa fa-floppy-disk hover:text-green-600 cursor-pointer"
          onClick={ doEdit }/>
      }
      <span className="ml-4 fa fa-trash hover:text-red-600 cursor-pointer"
        onClick={ doRemove }/>
    </>
  )
}
