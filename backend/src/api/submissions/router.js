import Express from "express";
import Multer from "multer";
import FileSystem from "fs";
import ChildProcess from "child_process";
import Path from "path"

import SubmissionsModel from "./model";

const router = Express.Router();
const upload = Multer()

router.get("/", async (req, res, next) => {
  try {
    let rows = await SubmissionsModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await SubmissionsModel.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.get("/submissionsassig/:assignid", async (req, res, next) => {
  try {
    let row = await SubmissionsModel.findAll({where: {assignmentID: req.params.assignid}});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single('submission'), async(req, res, next) => {
  try {
    let dirpath = Path.join("static", req.body.classid, req.body.assignid, "tests")
    let filenames = FileSystem.readdirSync(dirpath);
    let inputnames=[]
    let outputnames=[]
    let result={}

    for(let i = 0; i < filenames.length; i++) {
      if(filenames[i].substring(0,7) == 'entrada')
        inputnames.push(filenames[i]);
      else
        outputnames.push(filenames[i]);
    }

    FileSystem.writeFileSync(dirpath +'/'+ req.file.originalname, req.file.buffer,req.file.enconding);
      ChildProcess.execSync("g++ "+dirpath+'/'+req.file.originalname+" -o "+dirpath+"/program");
      let output = ''
      for(let i = 0; i < inputnames.length; i++) {
          ChildProcess.execSync(dirpath + "/program < " + dirpath+"/"+inputnames[i] +" > saida");
          try {
            output = ChildProcess.execSync("diff saida "+dirpath+"/"+outputnames[i]);
          } catch(err) { 
            output = err.stdout.toString('utf8');  
          }
          result[inputnames[i]] = output;
      }
    try {
      let rowtemp = await SubmissionsModel.create({
        studentGID: req.body.usergid,
        studentEmail: req.body.email,
        assignmentID: req.body.assignid,
        studentName: req.body.username,
        classID: req.body.classid
      })
    } catch(err) {
      next(err);
    }
    // g++ "+req.file.originalname+" -o program
    res.send(result);
  } catch (err) {
    next(err);
  }
});
// @italotabatinga: commented cause for now post method only returns analysis from g++, not updating db
// router.post("/", async (req, res, next) => {
//   try {
//     let row = await SubmissionsModel.create({
//       title: req.body.title,
//       description: req.body.description,
//       dueDate: req.body.dueDate,
//     });
//     res.json({ data: row });
//   } catch (err) {
//     next(err);
//   }
// });


router.put("/:id", async (req, res, next) => {
  try {
    let row = await SubmissionsModel.update({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await SubmissionsModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;