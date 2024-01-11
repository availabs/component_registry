import colorbrewer from 'colorbrewer';
import {getColorRange} from "~/modules/avl-components/src";
import {useState} from "react";


export const RenderColorPicker = ({numColors = 9, setNumColors, shade, setShade, colors, setColors, title}) => {
    const [open, setOpen] = useState(false);
    const shades = [
        ...colorbrewer.schemeGroups.sequential,
        ...colorbrewer.schemeGroups.diverging,
        ...colorbrewer.schemeGroups.singlehue,
    ];
    return (
        <div
            className={'p-2 pl-0 my-1 w-full flex flex-row place-middle'}
        >
            <div className={'self-top flex flex-row flex-wrap w-1/4'}>
                {
                    title && <span className={'self-center pt-1'}>{title}</span>
                }
            </div>
            <div className={'flex flex-row flex-wrap space-between w-3/4'}>
                {
                    setNumColors &&
                    <div className={'self-center py-1 rounded-l-lg'}>
                        <label className={'pl-1 pr-5 text-sm'}># Shades:</label>
                        <input type={'number'} min={1} max={9} value={numColors}
                               onChange={e => {
                                   e.stopPropagation();
                                   setNumColors(e.target.value);
                               }}
                               className={'self-center px-1 bg-white rounded-lg'}/>
                    </div>
                }
                <div className={'flex flex-col'}>
                    <div
                        onClick={() => setOpen(!open)}
                        className={'flex flex-col self-center rounded-r-lg'}
                    >
                        {
                            <div className={'block flex flex-row p-2'}>
                                {
                                    colors
                                        .map(color => <div className={`h-[20px] w-[20px]`} key={color}
                                                           style={{backgroundColor: color}}/>)
                                }
                            </div>
                        }
                    </div>
                    <div
                        className={`max-h-36 overflow-auto ${open ? 'block mt-[40px] absolute bg-white shadow-lg rounded-lg z-20' : 'hidden'}`}>
                        {
                            shades.map(s =>
                                <div
                                    className={'flex flex-row p-2'}
                                    key={s}
                                    onClick={() => {
                                        setShade(s);
                                        setColors(getColorRange(Math.max(numColors, 3), s, false).slice(0, +numColors));
                                        setOpen(false);
                                    }}
                                >
                                    {
                                        getColorRange(Math.max(numColors, 3), s, false)
                                            .slice(0, +numColors)
                                            .map(color => <div className={`h-[20px] w-[20px]`}
                                                               key={color}
                                                               style={{backgroundColor: color}}/>)
                                    }
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}