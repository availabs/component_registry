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