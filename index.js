const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res){
    res.send('Hello World!')
    res.write(<form action="/stats" enctype="multipart/form-data" method="post">)
    res.write(<div class="form-group">)
    res.write(<input type="file" class="form-control-file" name="uploaded_file">)
    res.write(<input type="text" class="form-control" placeholder="Number of speakers" name="nspeakers">)
    res.write(<input type="submit" value="Get me the stats!" class="btn btn-default">)            
    res.write(</div>)
    res.write(</form>)
}
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files is array of `photos` files
  // req.body will contain the text fields, if there were any
})

var cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})
