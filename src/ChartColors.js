export default class ChartColors {

    static getColors(count) {

        const bootstrapColors = [
            'primary',
            'secondary',
            'success',
            'danger',
            'warning',
            'info',
            'dark'
        ];

        const colors = bootstrapColors.map(
            name =>
                getComputedStyle(
                    document.documentElement
                )
                    .getPropertyValue(`--bs-${name}`)
                    .trim()
        );

        for (
            let index = colors.length;
            index < count;
            index++
        ) {
            const hue =
                ((index - bootstrapColors.length) * 137.508) % 360;

            colors.push(
                `hsl(${hue}, 65%, 50%)`
            );
        }

        return colors;
    }
}
