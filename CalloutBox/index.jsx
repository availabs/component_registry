import React, {useEffect, useState} from "react"
import {isJson} from "~/utils/macros.jsx";
import { dmsDataTypes } from "~/modules/dms/src"
import {RenderColorPicker} from "../shared/colorPickerSimple.jsx";

export const RenderCalloutBox = ({text = {}, backgroundColor, ...rest}) => {
    return (
        <div
            className={'flex justify-center items-center w-fit overflow-wrap p-5'}
            style={{minHeight: '150px', minWidth: '100px', maxWidth: '500px', backgroundColor: backgroundColor}}>
            <div className={`overflow-wrap break-word text-${text.size}`} style={{color: text.color}}>
                {text.text}
            </div>
        </div>
    )

}

const Edit = ({value, onChange}) => {
    const cachedData = value && isJson(value) ? JSON.parse(value) : {}
    const emptyTextBlock = {text: '', size: '4xl', color: '000000'};
    const [bgColor, setBgColor] = useState(cachedData?.bgColor || 'rgba(0,0,0,0)');
    const [text, setText] = useState(cachedData?.text || value || emptyTextBlock);

    useEffect(() => {
        onChange(JSON.stringify({bgColor, text}))
    }, [bgColor, text])

    const LexicalComp = dmsDataTypes.lexical.EditComp;

    return (
        <div className='w-full'>
            <div className='relative'>
                <RenderColorPicker title={'Background: '}
                                   className={'w-full px-2 py-1 flex flex-row text-sm items-center border border-dashed'}
                                   color={bgColor} setColor={setBgColor}/>
                    <LexicalComp value={text} onChange={setText} bgColor={bgColor}/>
            </div>
        </div>
    )
}

Edit.settings = {
    hasControls: true,
    name: 'ElementEdit'
}

const View = ({value}) => {
    if (!value) return ''
    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)
    const dataOrValue = data?.text || value;

    if(!dataOrValue ||
        (dataOrValue?.root?.children?.length === 1 && dataOrValue?.root?.children?.[0]?.children?.length === 0) ||
        (dataOrValue?.root?.children?.length === 0)
    ) return null;

    const LexicalComp = dmsDataTypes.lexical.ViewComp;
    return (
        <div>
            <LexicalComp value={dataOrValue} bgColor={data?.bgColor} />
        </div>
    )
}


export default {
    "name": 'Card: Callout',
    "hideInSelector": true,
    "EditComp": Edit,
    "ViewComp": View
}