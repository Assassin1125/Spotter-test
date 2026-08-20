export default function Background() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas">
            <div className="absolute -left-40 -top-56 h-[38rem] w-[38rem] animate-aurora-a rounded-full bg-brand/20 blur-[130px]" />
            <div className="absolute -right-40 top-10 h-[34rem] w-[34rem] animate-aurora-b rounded-full bg-aqua/[0.14] blur-[130px]" />
            <div className="absolute bottom-[-18rem] left-1/3 h-[36rem] w-[36rem] animate-aurora-c rounded-full bg-mint/[0.09] blur-[140px]" />

            <div
                className="absolute inset-0 bg-grid-fine bg-grid"
                style={{
                    maskImage: 'radial-gradient(ellipse 85% 60% at 50% 0%, #000 30%, transparent 78%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 85% 60% at 50% 0%, #000 30%, transparent 78%)',
                }}
            />

            <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand/[0.07] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-canvas via-canvas/80 to-transparent" />

            <div className="grain absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
        </div>
    );
}
