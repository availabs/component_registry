import React, {useEffect, useState} from "react"
import {Select} from '~/modules/avl-components/src'
import {isJson} from "~/utils/macros.jsx";
import {ButtonSelector} from "./shared/buttonSelector.jsx";


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

const RenderColorPicker = ({title, className, color, setColor}) => (
    <div className={className}>
        <label className={'shrink-0 pr-2 py-2 my-1 w-1/4'}>{title}</label>
        <input id={'background'} className={'my-1 rounded-md shrink'}
               type={'color'} value={color} onChange={e => setColor(e.target.value)}/>
    </div>
)

const Edit = ({value, onChange}) => {
    const cachedData = value && isJson(value) ? JSON.parse(value) : {}
    const emptyTextBlock = {text: '', size: '4xl', color: '000000'};
    const [backgroundColor, setBackgroundColor] = useState(cachedData?.backgroundColor || '#94cbff');
    const [text, setText] = useState(cachedData?.text || emptyTextBlock);

    useEffect(() => {
        onChange(JSON.stringify({backgroundColor, text}))
    }, [backgroundColor, text])

    console.log('color, text', text)
    return (
        <div className='w-full'>
            <div className='relative'>
                <RenderColorPicker title={'Background: '}
                                   className={'w-full pt-2 mt-3 flex flex-row text-sm items-center'}
                                   color={backgroundColor} setColor={setBackgroundColor}/>
                <div className={'w-full pt-2 mt-3 flex flex-row items-center text-sm'}>
                    <label className={'shrink-0 pr-2 py-2 w-1/4'}>Text: </label>
                    <textarea
                        key={`text`}
                        className={'my-1 p-2 rounded-md w-full border shrink'}
                        placeholder={'Enter text'}
                        value={text.text}
                        onChange={e => setText({...text, ...{text: e.target.value}})}
                    />
                </div>
                <div className={'w-full pt-2 mt-3 text-sm'}>
                    <RenderColorPicker title={'Color: '}
                                       className={'w-full my-1 flex flex-row text-sm items-center'}
                                       color={text.color} setColor={color => setText({...text, color})}/>
                </div>
                <div className={'w-full pt-2 mt-3 text-sm'}>
                    <ButtonSelector
                        label={'Size: '}
                        types={[
                            {label: 'Small', value: '4xl'},
                            {label: 'Medium', value: '5xl'},
                            {label: 'Large', value: '6xl'}
                        ]}
                        type={text.size}
                        setType={size => setText({...text, size})}
                    />
                </div>
                <RenderCalloutBox
                    text={text}
                    backgroundColor={backgroundColor}
                />
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
    console.log('value', value, data)

    return (
        <RenderCalloutBox {...data} />
    )
}


export default {
    "name": 'Card: Callout',
    "EditComp": Edit,
    "ViewComp": View
}