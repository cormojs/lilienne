import * as fs from "fs";
import * as path from "path";
import { Column } from "./column";

export default class VueConfig {
  static defaultConfigName: string = "view.json";

  columns: Column[];

  constructor(filename: string = VueConfig.defaultConfigName) {
    let data = fs.readFileSync(path.join(process.cwd(), filename), "utf8");
    let obj = JSON.parse(data);

    this.columns = (<object[]>obj.columns).map((o: Column) => new Column(o));
    console.log(this);
  }

  save(filename: string = VueConfig.defaultConfigName) {
    let data = {
      columns: this.columns.map((c) => {
        let o = {};
        Object.assign(o, c);
        delete o["_statuses"];
        return o;
      }),
    };
    fs.writeFileSync(
      path.join(process.cwd(), filename),
      JSON.stringify(data, null, 4),
    );
  }
}
