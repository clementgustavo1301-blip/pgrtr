const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "PGRTR_Template.docx"})
    .then(result => {
        fs.writeFileSync("template_content.txt", result.value, "utf-8");
        console.log(result.value);
    })
    .catch(err => console.error(err));
