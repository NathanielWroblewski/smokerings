import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import coordinates from './isomorphisms/coordinates.js'
import renderLine from './views/line.js'
import renderCircle from './views/circle.js'
import renderPolygon from './views/polygon.js'
import { stableSort, remap } from './utilities/index.js'
import { seed, noise } from './utilities/noise.js'
import { BORDER_COLOR, INNER_COLOR } from './constants/colors.js'
import {
  ZOOM, FPS, r, Δθdeg, MAX_TIME, MIN_TIME, ΔrotY, CEILING_START, CEILING_END,
  FLOOR_START, FLOOR_END
} from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')

const { sin, cos } = Math

seed(Math.random())

const perspective = FourByFour.identity()
  .rotX(angles.toRadians(-20))

const camera = new Camera({
  position: Vector.zeroes(),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: ZOOM
})

const START = Vector.from([0, -15, 0])
const ΔOFFSET = Vector.from([0, 0.03, 0])

let t = 0
let Δt = 1
let offsets = [
  START,
  START.add(Vector.from([0, -7, 0])),
  START.add(Vector.from([0, -14, 0])),
]
const φs = [0, 0.3, -0.15]

const getOpacity = height => {
  if (height < FLOOR_START) return 0
  if (height < FLOOR_END) return remap(height, [FLOOR_START, FLOOR_END], [0, 1])
  if (height > CEILING_END) return 0
  if (height > CEILING_START) return 1 - remap(height, [CEILING_START, CEILING_END], [0, 1])

  return 1
}

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  offsets.forEach((offset, index) => {
    let prev = null

    for (let θdeg = 0; θdeg <= 360; θdeg += Δθdeg) {
      const θ = angles.toRadians(θdeg)
      const φ = φs[index] + noise(offset.y * 0.05, θ * 0.5, t * 0.008) * 0.3
      const cartesian = coordinates.toCartesian([r, θ, φ])
      const position = camera.project(cartesian.add(offset).transform(perspective))

      if (prev) {
        context.globalAlpha = getOpacity(offset.y)
        context.shadowBlur = 6
        context.shadowColor = BORDER_COLOR
        renderLine(context, prev, position, BORDER_COLOR, 4)

        context.shadowBlur = 1
        context.shadowColor = INNER_COLOR
        renderLine(context, prev, position, INNER_COLOR, 1.5)
      }

      prev = position
    }
  })

  offsets = offsets.map(offset => (
    offset.y > CEILING_END ? START : offset.add(ΔOFFSET)
  ))

  if (t > MAX_TIME || t < MIN_TIME) Δt = -Δt
  t += Δt
  perspective.rotY(ΔrotY)
}

let prevTick = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
