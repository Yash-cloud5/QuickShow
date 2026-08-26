const BlurCircle = ({
  top = 'auto',
  left = 'auto',
  right = 'auto',
  bottom = 'auto'
}) => {
  return (
    <div
      className='absolute w-72 h-72 rounded-full bg-red-500 blur-3xl opacity-40 pointer-events-none'
      style={{
        top: top,
        left: left,
        right: right,
        bottom: bottom,
      }}
    ></div>
  )
}

export default BlurCircle