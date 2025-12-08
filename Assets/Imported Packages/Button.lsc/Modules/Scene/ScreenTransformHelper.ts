export class ScreenTransformHelper {
    static expandRectSidePositions(rect: Rect, right: number, left: number, top: number, bottom: number): void {
        rect.right = rect.right + right;
        rect.left = rect.left - left;
        rect.top = rect.top + top;
        rect.bottom = rect.bottom - bottom;
    }

    static setRectSidePositions(rect: Rect, right: number, left: number, top: number, bottom: number): void {
        rect.right = right;
        rect.left = left;
        rect.top = top;
        rect.bottom = bottom;
    }
}
