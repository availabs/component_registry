import {Switch} from "@headlessui/react";
import React from "react";

export const RenderSwitch = ({label, value, setValue}) => (
    <div className={'block w-full flex mt-1'}>
        <label className={'align-bottom shrink-0pr-2 py-2 my-1 w-1/4'}> {label}: </label>
        <div className={'align-bottom p-2 pl-0 my-1 rounded-md shrink self-center'}>
            <Switch
                key={label}
                checked={value}
                onChange={e => setValue(!value)}
                className={
                    `
                                    ${value ? 'bg-indigo-600' : 'bg-gray-200'}
                                    relative inline-flex 
                                     h-4 w-10 shrink
                                     cursor-pointer rounded-full border-2 border-transparent 
                                     transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0.5
                                     focus:ring-indigo-600 focus:ring-offset-2`
                }
            >
                <span className="sr-only">toggle {label}</span>
                <span
                    aria-hidden="true"
                    className={
                        `
                                        ${value ? 'translate-x-5' : 'translate-x-0'}
                                        pointer-events-none inline-block 
                                        h-3 w-4
                                        transform rounded-full bg-white shadow ring-0 t
                                        transition duration-200 ease-in-out`
                    }
                />
            </Switch>
        </div>
    </div>
)