import axios from "axios"
import { ElementNode, parse, RootNode } from "svg-parser"
import { pointsOnPath } from "points-on-path"
import { absolutize, normalize, parsePath } from "path-data-parser"
import { optimize } from "svgo"

type WidgetPathType = {
  path: string
  id: string
  strokeWidth?: number
  strokeColor?: string
}

export default class SvgUrlToWidgetPath {
  readonly svgUrl: string
  readonly svgMaxWidth: number
  readonly svgMaxHeight: number

  constructor(svgUrl: string, svgMaxWidth: number, svgMaxHeight: number) {
    this.svgUrl = svgUrl
    this.svgMaxWidth = svgMaxWidth
    this.svgMaxHeight = svgMaxHeight
  }

  optimizePathMCommand = (path: string) => {
    // Adds L in path after first point of M if it needed
    return path.replaceAll(
      /(M(?:[0-9]|\.)*(?:\s|,)(?:[0-9]|\.)*(?:\s|,))([0-9]*)/g,
      (matchStr, moveCoordinate, lineCoordinate) => {
        if (!lineCoordinate) return matchStr
        return `${moveCoordinate}L${lineCoordinate}`
      }
    )
  }

  convertToWidgetPath = (strokesObj: ElementNode): WidgetPathType => {
    const { d, style } = strokesObj.properties!
    const convertedD = this.optimizePathMCommand(d as string)
    let pathObj: any = { path: convertedD, id: Math.floor(Math.random() * 10000000000000).toString() }
    const strokeColor = ((style as string || '').match(/stroke:(#[0-9a-fA-F]{6});/) || [])[1] || '#000000'
    const strokeWidth = ((style as string || '').match(/stroke-width:([0-9]*);/) || [])[1]
    if (strokeWidth) pathObj = { ...pathObj, strokeWidth: +strokeWidth || 30 }
    if (strokeColor) pathObj = { ...pathObj, strokeColor }

    return pathObj
  }

  getStrokeLines = (svg: ElementNode | RootNode, acc: ElementNode[] = []): ElementNode[] => {
    const isPathElem = 'properties' in svg && svg?.properties?.d
    const isStrokeElem =
      'properties' in svg &&
      svg?.properties?.style &&
      (svg?.properties?.style as string || '').includes('stroke:')

    if (isPathElem && isStrokeElem) return [...acc, svg]
    return (svg?.children as ElementNode[] || []).reduce((acc, svg) => {
      return this.getStrokeLines(svg, acc)
    }, acc)
  }

  resizeWidgetPaths = (paths: WidgetPathType[]) => {
    const maxPoint = paths.map(el => pointsOnPath(el.path)[0]).reduce((acc, point) => {
      let newMaxPoint = acc
      point.forEach(el => {
        if (el[0] > acc.x) newMaxPoint.x = el[0]
        if (el[1] > acc.y) newMaxPoint.y = el[1]
      })
      return newMaxPoint
    }, { x: 0, y: 0 })

    if (this.svgMaxHeight >= maxPoint.y && this.svgMaxWidth >= maxPoint.x) {
      return paths
    } else {
      const isMaxHeight = Math.abs(this.svgMaxHeight - maxPoint.y) > Math.abs(this.svgMaxWidth - maxPoint.x)
      const maxBoxValue = isMaxHeight ? this.svgMaxHeight : this.svgMaxWidth
      const maxPointValue = isMaxHeight ? maxPoint.y : maxPoint.x
      const divider = maxPointValue / maxBoxValue

      return paths.reduce((acc, path) => {
        const parsed = parsePath(path.path)
        const normalized = normalize(absolutize(parsed))
        const resizedPath = normalized.reduce((acc, el) => {
          let resizedStringCommand = ''
          resizedStringCommand += el.key
          el.data.forEach(coord => {
            resizedStringCommand += ` ${Math.round(coord / divider)}`
          })
          return acc + resizedStringCommand
        }, '')
        const strokeWidth = Math.ceil((path.strokeWidth || 1) / divider)
        return [...acc, { ...path, path: resizedPath, strokeWidth }]
      }, [] as WidgetPathType[])
    }
  }

  fetchSvg = async () => {
    const svgData = await axios.get<string>(this.svgUrl)
    return svgData?.data
  }

  getWidgetPath = async (): Promise<WidgetPathType[] | undefined> => {
    const svg = await this.fetchSvg()
    if (svg) {
      const optimizedSvg = await optimize(
        svg,
        {
          full: true,
          multipass: true,
          plugins: [
            { name: 'convertShapeToPath', active: true, params: { convertArcs: true } },
            { name: 'inlineStyles', active: true, params: { onlyMatchedOnce: false } },
            { name: 'convertPathData', active: true, params: { forceAbsolutePath: true, straightCurves: true, utilizeAbsolute: true, floatPrecision: 0, lineShorthands: false } },
          ]
        })

      if ('data' in optimizedSvg) {
        const parsedSvg = parse(optimizedSvg.data)
        const strokes = this.getStrokeLines(parsedSvg)
        const widgetPaths = strokes.map(this.convertToWidgetPath)
        return this.resizeWidgetPaths(widgetPaths)
      }
    }
  }
}