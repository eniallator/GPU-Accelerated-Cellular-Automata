local shader, canvasImage, canvasData, canvas, prevCanvas, timeAcc, tps, lifetime

function love.load(args)
    tps = 2

    shader = love.graphics.newShader('shader.frag')
    canvas = love.graphics.newCanvas(love.graphics.getDimensions())
    prevCanvas = love.graphics.newCanvas(love.graphics.getDimensions())

    timeAcc = 0
    lifetime = os.time()
end

function love.update(dt)
    timeAcc = timeAcc + dt
    while timeAcc > 1 / tps do
        timeAcc = timeAcc - 1 / tps
        lifetime = lifetime + 1
        canvas, prevCanvas = prevCanvas, canvas
        canvas:renderTo(
            function()
                shader:send('dimensions', {love.graphics.getDimensions()})
                shader:send('time', lifetime)
                love.graphics.setShader(shader)
                love.graphics.draw(prevCanvas)
                love.graphics.setShader()
            end
        )
    end
end

function love.draw()
    love.graphics.draw(canvas)
end
