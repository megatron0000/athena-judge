import Express from "express";
import Multer from "multer"
// import FileSystem from "fs"
import AssignmentsModel from "./model";

const router = Express.Router();
const upload = Multer()

router.use(Express.static('assignments'));

/*@italotabatinga: Testing upload-server*/
router.post("/upload", upload.fields(
  [{ name: 'attachments', maxCount: 10},
   { name: 'tests', maxCount: 10}]
), async(req, res, next) => {
  try {
      let row = await AssignmentsModel.create({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate
    });
    /*console.log(req.body);
    console.log('Arquivos-------',req.files);
    FileSystem.mkdirSync("static/" + req.body.courseId +'/' + row.id);
    FileSystem.mkdirSync("static/" + req.body.courseId +'/' + row.id + '/' + 'attachments');
    FileSystem.mkdirSync("static/" + req.body.courseId +'/' + row.id + '/' + 'tests');

    let attachments = req.files['attachments'] | [];
    let tests = req.files['tests'] | [];
    
    for(let i = 0; i < attachments.length; i++) {
      FileSystem.writeFile("static/" + req.body.courseId +'/' + row.id + '/'+ 'attachments/' + attachments[i].originalname, attachments[i].buffer,attachments[i].enconding, (err) => {
        console.log(err);
      });
    }

    for(let i = 0; i < tests.length; i++) {
      FileSystem.writeFile("static/" + req.body.courseId +'/' + row.id + '/'+ 'tests/' + tests[i].originalname, tests[i].buffer,tests[i].enconding, (err) => {
        console.log(err);
      });
    }*/

    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    let rows = await AssignmentsModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await AssignmentsModel.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.get("/course/:courseId", async (req, res, next) => {
  try {
    let rows = await AssignmentsModel.findAll({where: {courseId: req.params.courseId}});
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let row = await AssignmentsModel.create({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let row = await AssignmentsModel.update({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await AssignmentsModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;