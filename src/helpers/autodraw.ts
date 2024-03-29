import axios from 'axios'

const API_ENDPOINT = 'https://inputtools.google.com/request?ime=handwriting&app=autodraw&dbg=1&cs=1&oe=UTF-8'
const SVG_ENDPOINT = 'https://storage.googleapis.com/artlab-public.appspot.com/stencils/selman/'

function boundingRect (shapes: any) {
  const res = shapes.reduce(function (prev: any, shape: any) {
    return shape.reduce(function (prev2: any, point: any) {
      if (point.x > prev2.maxX) {
        prev2.maxX = point.x
      } else if (point.x < prev2.minX) {
        prev2.minX = point.x
      }
      if (point.y > prev2.maxY) {
        prev2.maxY = point.y
      } else if (point.y < prev2.minY) {
        prev2.minY = point.y
      }
      return prev2
    }, prev)
  }, {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  })

  return {
    width: res.maxX - res.minX,
    height: res.maxY - res.minY
  }
}

function getResults (data: any) {
  const regex = /SCORESINKS: (.*) Service_Recognize:/
  return JSON.parse(data[1][0][3].debug_info.match(regex)[1])
}

export default function (shapes: any, frame?: any, startDate?: any) {
  if (!Array.isArray(shapes[0])) {
    shapes = [shapes]
  }

  if (typeof frame === 'number') {
    startDate = frame
    frame = undefined
  }

  if (!startDate) {
    startDate = 0
  }

  const ink = shapes.map(function (shape: any) {
    return shape.reduce(function (prev: any, point: any) {
      prev[0].push(point.x)
      prev[1].push(point.y)
      if (point.timestamp) {
        prev[2].push(point.timestamp - startDate)
      }
      return prev
    }, [[], [], []])
  })

  if (!frame) {
    frame = boundingRect(shapes)
  }

  return axios.post(API_ENDPOINT, {
    input_type: 0,
    requests: [{
      language: 'autodraw',
      writing_guide: frame,
      ink: ink
    }]
  }).then(function (response: any) {
    const data = response.data
    if (data[0] !== 'SUCCESS') {
      throw new Error(data)
    }
    const results = getResults(data)
    return results.map(function (result: any) {
      const escapedName = result[0].replace(/ /g, '-')
      return {
        name: result[0],
        confidence: result[1],
        url: SVG_ENDPOINT + escapedName + '-01.svg',
        url_variant_1: SVG_ENDPOINT + escapedName + '-02.svg',
        url_variant_2: SVG_ENDPOINT + escapedName + '-03.svg'
      }
    })
  })
}