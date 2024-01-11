import React from "react";

export const RenderColorPicker = ({title, className, color, setColor}) => (
    <div className={className}>
        <label className={'shrink-0 pr-2 w-1/4'}>{title}</label>
        <input id={'background'} list="colors"
               className={'rounded-md shrink'}
               type={'color'} value={color} onChange={e => setColor(e.target.value)}/>
        <datalist id="colors">
            {
                [
                    // blues
                    '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6','#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',

                    // yellows
                    '#713f12', '#854d0e', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3', '#fefce8',


                ].map(c => <option key={c}>{c}</option>)
            }
        </datalist>
    </div>
)