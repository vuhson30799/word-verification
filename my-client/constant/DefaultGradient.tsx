import {defaultGradientId} from "./ApplicationConstant";

export function DefaultGradient() {
    return (
        <svg>
            <defs>
                <radialGradient id={defaultGradientId}>
                    <stop offset="0" stopColor="#E05178"/>
                    <stop offset="1" stopColor="#B541E2"/>
                </radialGradient>
            </defs>
        </svg>
    )
}
