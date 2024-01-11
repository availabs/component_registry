export const DisplayToggle = ({
    showSelector, setShowSelector, hide = false
}) => !hide && (
    <div className={'w-full flex justify-end'}>
        <button
            className={'text-blue-500 hover:text-blue-800 text-xs float-right'}
            onClick={() => setShowSelector(!showSelector)}
        >{showSelector ? 'hide version selector' : 'change dataset version'}</button>
    </div>
)