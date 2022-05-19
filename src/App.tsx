import React, { useEffect, useState } from 'react'
import { pointsOnPath } from "points-on-path"

import { autodraw, SvgUrlToWidgetPath } from '~helpers'

import './App.css'

type AssumptionType = {
  name: string
  url: string
  url_variant_1: string
  url_variant_2: string
}

const App: React.FC = () => {
  const [assumptions, setAssumptions] = useState<AssumptionType[]>([])

  useEffect(() => {
    setTimeout(findAssumptedImagesToSelected, 500)
  }, [])

  const findAssumptedImagesToSelected = async () => {
    if (!window.muralSdk) return
    const drawingWidgets = await window.muralSdk.sdk.selection.list()
    const coords: { path: string }[] = Object.values(drawingWidgets[0].properties.paths || {})

    const newShapes = coords.map(coord => {
      const { path } = coord

      return pointsOnPath(path)[0].map(point => {
        return { x: Math.round(point[0]), y: Math.round(point[1]) }
      })
    })

    autodraw(newShapes).then(setAssumptions)
  }

  const drawSelectedSvg = async (url: string) => {
    const drawingWidgets = await window.muralSdk.sdk.selection.list()
    const drawingWidget = drawingWidgets.find((widget: Record<string, any>) => widget.type.includes('InkingWidget'))
    if (drawingWidget) {
      const test = new SvgUrlToWidgetPath(url, drawingWidget.width, drawingWidget.height)
      const strokesElement = await test.getWidgetPath()
      if (strokesElement) {
        const widgetId = drawingWidget?.id
        const widgetPaths = drawingWidget?.properties?.paths
        await window.muralSdk.widgets.inking.removeStrokes(widgetId, Object.keys(widgetPaths), 'undo')
        await window.muralSdk.widgets.inking.addStrokes(widgetId, strokesElement)
      }
    }
  }

  return (
    <div className={'assumptions'}>
      {assumptions.map(assumption => {
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
