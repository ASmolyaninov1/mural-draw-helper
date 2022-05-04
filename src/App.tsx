import React, { useEffect, useRef, useState } from 'react'
import axios from "axios"
import { parse, ElementNode, RootNode } from 'svg-parser'
import { optimize } from 'svgo'
import { pointsOnPath } from "points-on-path"
import { parsePath as testParsePath, absolutize, normalize } from 'path-data-parser';
import {
  Command,
  CurveToCommand,
  parseSVG as parsePath,
  QuadraticCurveToCommand
} from "svg-path-parser"

import { autodraw } from '~helpers'

import './App.css'

type PointType = { x: number; y: number }
type ShapeType = PointType[]
type AssumptionType = {
  name: string
  url: string
  url_variant_1: string
  url_variant_2: string
}
type WidgetPathType = {
  path: string
  id: string
  strokeWidth?: number
  strokeColor?: string
}

const TestCanvas: React.FC<{ shapes: ShapeType[] }> = ({ shapes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      console.log('check')
      ctx.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0)
      shapes.forEach(shape => {
        if (shape.length > 0) {
          ctx.moveTo(shape[0].x, shape[0].y)
          shape.forEach(point => {
            ctx.lineTo(point.x, point.y)
            ctx.stroke()
          })
        }
      })
    }
  }, [shapes])
  return <canvas ref={canvasRef} width={3000} height={3000} />
}

const App: React.FC = () => {
  const [assumptions, setAssumptions] = useState<AssumptionType[]>([])
  const [shapes, setShapes] = useState<ShapeType[]>([])
  const [renderShapes, setRenderShapes] = useState<ShapeType[]>([])

  useEffect(() => {
    setTimeout(interpretImage, 500)
  }, [])

  const sendShapes = (shapes: ShapeType[]) => {
    autodraw(shapes).then(setAssumptions)
  }

  const interpretImage = async () => {
    const drawingWidgets = await window.muralSdk.sdk.selection.list()
    // console.log('drawingWidgets => ', drawingWidgets)
    const coords: { path: string }[] = Object.values(drawingWidgets[0].properties.paths || {})
    // const coords = [
    //   { path: "M1154 605H1329C1329 764 1179 895 984 918A518 518 0 0 1 874 919C674 900 519 767 519 605H1154z" },
    //   { path: "M979 604V532H879V604" },
    //   { path: "M1023 357H1079" },
    //   { path: "M704 605V513" },
    //   { path: "M704 505H654" },
    //   { path: "M1154 605V513" },
    //   { path: "M1204 505H1154" },
    //   { path: "M929 530V267" },
    //   { path: "M1054 357V357" },
    //   { path: "M929 280A63 63 0 0 1 1054 280V357" },
    //   { path: "M874 1553V918" },
    //   { path: "M984 1553V918" },
    //   { path: "M984 1553C984 1636 1051 1703 1134 1703H724C807 1703 874 1636 874 1553" },
    //   { path: "M1054 432V530" }
    // ]

    const maxPointValue = coords.map(coord => pointsOnPath(coord.path)[0]).reduce((acc, shape) => {
      let newMaxPointValue = acc
      shape.forEach(el => {
        if (el[0] > acc) newMaxPointValue = el[0]
        if (el[1] > acc) newMaxPointValue = el[1]
      })
      return newMaxPointValue
    }, 0)

    const newShapes = coords.map(coord => {
      const { path } = coord

      // const pathCommands: Command[] = parsePath(path).map(command => {
      //   let commandWithRoundedPoints = {...command}
      //   ;(Object.keys(command) as (keyof typeof command)[]).forEach(key => {
      //     if (!isNaN(+(command[key] || ''))) {
      //       commandWithRoundedPoints = {
      //         ...commandWithRoundedPoints,
      //         [key]: Math.round(+command[key]!)
      //       }
      //     }
      //   })
      //   return commandWithRoundedPoints
      // })


      return pointsOnPath(path)[0].map(point => {
        const divider = Math.round(maxPointValue / 300)
        return { x: Math.round(point[0]/divider), y: Math.round(point[1]/divider) }
      })

      // const findPointsOnLineByTwoPoints: (...args: number[]) => ShapeType = (x1, x2, y1, y2) => {
      //   const fn = (a: number, b: number, t: number) => (10*a - 10*a*t + 10*t*b)/10
      //   const getPoint = (t: number) => ({ x: fn(x1, x2, t), y: fn(y1, y2, t) })
      //   return new Array(21).fill(0).map((_, index) => getPoint(index/20))
      // }
      //
      // const findPointsOnCurveByThreePoints: (...args: number[]) => ShapeType = (x1, x2, x3, y1, y2, y3: number): ShapeType => {
      //   const fn = (a: number, b: number, c: number, t: number) => (
      //     10*a - 20*t*a + 10*Math.pow(t, 2)*a + 20*t*b - 20*Math.pow(t, 2)*b + 10*Math.pow(t, 2)*c
      //   )
      //   const getPoint = (t: number) => ({ x: fn(x1, x2, x3, t), y: fn(y1, y2, y3, t) })
      //   return new Array(21).fill(0).map((_, index) => getPoint(index/20))
      // }
      //
      // const findPointsOnCurveByFourPoints: (...args: number[]) => ShapeType = (x1, x2, x3, x4, y1, y2, y3, y4) => {
      //   const fn = (a: number, b: number, c: number, d: number, t: number) => (
      //     (10*a - 30*t*a + 30*Math.pow(t, 2)*a - 10*Math.pow(t, 3)*a + 30*t*b - 60*b*Math.pow(t, 2) + 30*b*Math.pow(t, 3) + 30*c*Math.pow(t, 2) - 30*c*Math.pow(t, 3) + 10*d*Math.pow(t, 3))/10
      //   )
      //   const getPoint = (t: number) => ({ x: fn(x1, x2, x3, x4, t), y: fn(y1, y2, y3, y4, t) })
      //   return new Array(21).fill(0).map((_, index) => getPoint(index/20))
      // }
      //
      // const getCoordinatedByPathCommands = (pathCommands: Command[]): ShapeType => {
      //   let lastPoint = {x: 0, y: 0}
      //
      //   return pathCommands.reduce((acc, pathCommand, index) => {
      //     if (pathCommand.code === 'M') {
      //       const { x, y } = pathCommand
      //       lastPoint = { x, y }
      //       return acc
      //     }
      //     if (pathCommand.code === 'Q') {
      //       const { x, y, x1, y1 } = pathCommand
      //
      //       const curvePoints = findPointsOnCurveByThreePoints(lastPoint.x, x1, x, lastPoint.y, y1, y)
      //       lastPoint = { x: x1, y: y1 }
      //       return [...acc, ...curvePoints]
      //     }
      //
      //     if (pathCommand.code === 'L') {
      //       const { x, y } = pathCommand
      //       const linePoints = findPointsOnLineByTwoPoints(lastPoint.x, x, lastPoint.y, y)
      //       lastPoint = { x, y }
      //       return [...acc, ...linePoints]
      //     }
      //
      //     if (pathCommand.code === 'V') {
      //       const { y } = pathCommand
      //       const linePoints = findPointsOnLineByTwoPoints(lastPoint.x, lastPoint.x, lastPoint.y, y)
      //       lastPoint = { x: lastPoint.x, y }
      //       return [...acc, ...linePoints]
      //     }
      //
      //     if (pathCommand.code === 'H') {
      //       const { x } = pathCommand
      //       const linePoints = findPointsOnLineByTwoPoints(lastPoint.x, x, lastPoint.y, lastPoint.y)
      //       lastPoint = { x, y: lastPoint.y }
      //       return [...acc, ...linePoints]
      //     }
      //
      //     if (pathCommand.code === 'C') {
      //       const { x, x1, x2, y, y1, y2 } = pathCommand
      //       const curvePoints = findPointsOnCurveByFourPoints(lastPoint.x, x1, x2, x, lastPoint.y, y1, y2, y)
      //       lastPoint = { x, y }
      //       return [...acc, ...curvePoints]
      //     }
      //
      //     if (pathCommand.code === 'S') {
      //       const { x, y, x2, y2 } = pathCommand
      //       const { x2: prevCurveX2, y2: prevCurveY2 } = pathCommands[index - 1] as CurveToCommand
      //       const x1 = 2*lastPoint.x - prevCurveX2
      //       const y1 = 2*lastPoint.y - prevCurveY2
      //       const curvePoints = findPointsOnCurveByFourPoints(lastPoint.x, x1, x2, x, lastPoint.y, y1, y2, y)
      //       lastPoint = { x, y }
      //       return [...acc, ...curvePoints]
      //     }
      //
      //     if (pathCommand.code === 'T') {
      //       const { x, y } = pathCommand
      //       const { x1: prevCurveX1, y1: prevCurveY1 } = pathCommands[index - 1] as QuadraticCurveToCommand
      //       const x1 = 2*lastPoint.x - prevCurveX1
      //       const y1 = 2*lastPoint.y - prevCurveY1
      //       const curvePoints = findPointsOnCurveByThreePoints(lastPoint.x, x1, x, lastPoint.y, y1, y)
      //       lastPoint = { x, y }
      //       return [...acc, ...curvePoints]
      //     }
      //
      //     return acc
      //   }, [] as ShapeType)
      // }
      //
      // return getCoordinatedByPathCommands(pathCommands)
    })

    sendShapes(newShapes)
    // setShapes(newShapes)
  }

  const convertSvgToPath = async (url: string): Promise<WidgetPathType[] | undefined> => {
    const svgData = await axios.get<string>(url)
    const svg = svgData?.data

    const convertPath = (path: string) => {
      // Adds L in path after first point of M if it needed
      return path.replaceAll(
        /(M(?:[0-9]|\.)*(?:\s|,)(?:[0-9]|\.)*(?:\s|,))([0-9]*)/g,
        (matchStr, moveCoordinate, lineCoordinate) => {
          if (!lineCoordinate) return matchStr
          return `${moveCoordinate}L${lineCoordinate}`
        }
      )
    }
    const getPath = (strokesObj: ElementNode): WidgetPathType => {
      const { d, style } = strokesObj.properties!
      const convertedD = convertPath(d as string)
      let pathObj: any = { path: convertedD, id: Math.floor(Math.random() * 10000000000000).toString() }
      const strokeColor = ((style as string || '').match(/stroke:(#[0-9a-fA-F]{6});/) || [])[1] || '#000000'
      const strokeWidth = ((style as string || '').match(/stroke-width:([0-9]*);/) || [])[1]
      if (strokeWidth) pathObj = { ...pathObj, strokeWidth: +strokeWidth || 30 }
      if (strokeColor) pathObj = { ...pathObj, strokeColor }

      return pathObj
    }
    const getStrokes = (acc: WidgetPathType[] = [], svg: ElementNode | RootNode): WidgetPathType[] => {
      const isPathElem = 'properties' in svg && svg?.properties?.d
      const isStrokeElem =
        'properties' in svg &&
        svg?.properties?.style &&
        (svg?.properties?.style as string || '').includes('stroke:')

      if (isPathElem && isStrokeElem) {
        const widgetPath = getPath(svg)
        return [...acc, widgetPath]
      }
      return (svg?.children as ElementNode[] || []).reduce(getStrokes, acc)
    }

    if (svg) {
      const test = await optimize(
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

      if ('data' in test) {
        const parsed = parse(test.data)
        return getStrokes([], parsed)
      }
    }
  }

  const drawSelectedSvg = async (url: string) => {
    const strokesElement = await convertSvgToPath(url)
    if (strokesElement) {
      const drawingWidgets = await window.muralSdk.sdk.selection.list()
      const drawingWidget = drawingWidgets.find((widget: Record<string, any>) => widget.type.includes('InkingWidget'))
      if (drawingWidget) {
        const widgetId = drawingWidget?.id
        const widgetPaths = drawingWidget?.properties?.paths
        await window.muralSdk.widgets.inking.removeStrokes(widgetId, Object.keys(widgetPaths), 'undo')
        await window.muralSdk.widgets.inking.addStrokes(widgetId, strokesElement)
      }
    }
  }

  return (
    <div className={'assumptions'}>
      {/*<div>*/}
      {/*  {shapes.map((shape, index) => {*/}
      {/*    return (*/}
      {/*      <div style={{ display: 'flex' }}>*/}
      {/*        <button style={{ marginRight: '10px' }} onClick={() => setRenderShapes([...shapes.filter((_, i) => index !== i)])}>remove</button>*/}
      {/*        <button style={{ marginRight: '10px' }} onClick={() => setRenderShapes([shape])}>check only</button>*/}
      {/*        <div>shape {index}</div>*/}
      {/*      </div>*/}
      {/*    )*/}
      {/*  })}*/}
      {/*  {JSON.stringify(renderShapes)}*/}
      {/*</div>*/}
      {/*<TestCanvas shapes={renderShapes} />*/}
      {assumptions.map((assumption: any) => {
        return (
          <div className={'assumptions-item'}>
            <img
              key={assumption.name}
              src={assumption.url}
              onClick={() => drawSelectedSvg(assumption.url)}
              onError={() => {
                const newAssumptions = assumptions.filter(el => el.name !== assumption.name)
                setAssumptions(newAssumptions)
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default App
