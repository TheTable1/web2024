const RB = ReactBootstrap;
const { Alert, Card, Button } = ReactBootstrap;

// ใช้ config จาก Firebase (เวอร์ชันใช้กับ <script>)
const firebaseConfig = {
  apiKey: "AIzaSyCSA1CP8TPuNkwil1HmRHXZvXV3Wd_5EgU",
  authDomain: "web2567-4f1ca.firebaseapp.com",
  projectId: "web2567-4f1ca",
  storageBucket: "web2567-4f1ca.firebasestorage.app",
  messagingSenderId: "199041789349",
  appId: "1:199041789349:web:f69aef8feee75262b84c4c",
  measurementId: "G-CFW2ZF0W1Y",
};

// ตรวจสอบว่า Firebase ถูก initialize หรือยัง
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


function StudentTable({ data, app }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>รหัส</th>
          <th>คำนำหน้า</th>
          <th>ชื่อ</th>
          <th>สกุล</th>
          <th>email</th>
          <th>การกระทำ</th>
        </tr>
      </thead>
      <tbody>
        {data.map((s) => (
          <tr key={s.id}>
            <td>{s.id}</td>
            <td>{s.title}</td>
            <td>{s.fname}</td>
            <td>{s.lname}</td>
            <td>{s.email}</td>
            <td>
              <EditButton std={s} app={app} />
            </td>
            <td>
              <DeleteButton std={s} app={app} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


function TextInput({ label, app, value, style }) {
  return (
    <label className="form-label">
      {label}:
      <input
        className="form-control"
        style={style}
        value={app.state[value]}
        onChange={(ev) => {
          var s = {};
          s[value] = ev.target.value;
          app.setState(s);
        }}
      ></input>
    </label>
  );
}

function EditButton({ std, app }) {
  return <button onClick={() => app.edit(std)}>แก้ไข</button>;
}

function DeleteButton({ std, app }) {
  return <button onClick={() => app.delete(std)}>ลบ</button>;
}

function LoginBox(props) {
    const u = props.user;
    const app = props.app;
    if (!u) {
        return <div><Button onClick={() => app.google_login()}>Login</Button></div>
    } else {
        return (
          <div className="flex flex-col items-center space-y-4">
            <img
              src={u.photoURL}
              alt="User Profile"
              className="w-32 h-32 rounded-full border-2 border-gray-300"
            />
            <p className="mt-2 text-lg font-medium">{u.email}</p>
            <Button
              onClick={() => app.google_logout()}
              className=" mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Logout
            </Button>
          </div>
        );

    }
}


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scene: 0,
      user: null,
      student: [],
      stdid: "",
      stdtitle: "",
      stdfname: "",
      stdlname: "",
      stdemail: "",
      stdphone: "",
    };

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user: user.toJSON() });
      } else {
        this.setState({ user: null });
      }
    });
  }

  google_login() {
    // Using a popup.
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    firebase.auth().signInWithPopup(provider);
  }

  google_logout() {
    if (confirm("Are you sure?")) {
      firebase.auth().signOut();
    }
  }

  // อ่านข้อมูลจาก Firestore
  readData = () => {
    db.collection("student")
      .get()
      .then((querySnapshot) => {
        let stdlist = [];
        querySnapshot.forEach((doc) => {
          stdlist.push({ id: doc.id, ...doc.data() });
        });
        console.log(stdlist);
        this.setState({ student: stdlist });
      })
      .catch((error) => console.error("Error reading data: ", error));
  };

  // อ่านข้อมูลอัตโนมัติแบบ Real-time
  autoRead = () => {
    db.collection("student").onSnapshot((querySnapshot) => {
      let stdlist = [];
      querySnapshot.forEach((doc) => {
        stdlist.push({ id: doc.id, ...doc.data() });
      });
      this.setState({ student: stdlist });
    });
  };

  insertOrUpdateData() {
    if (this.state.stdid) {
      // ตรวจสอบว่าเอกสารมีอยู่หรือไม่
      db.collection("student")
        .doc(this.state.stdid) // ใช้ stdid ที่กรอกเป็น document ID
        .get()
        .then((docSnapshot) => {
          if (docSnapshot.exists) {
            // อัปเดตข้อมูลถ้ามีเอกสาร
            db.collection("student")
              .doc(this.state.stdid) // ใช้ stdid ที่กรอกเป็น document ID
              .update({
                stdid: this.state.stdid || "",
                title: this.state.stdtitle || "",
                fname: this.state.stdfname || "",
                lname: this.state.stdlname || "",
                phone: this.state.stdphone || "",
                email: this.state.stdemail || "",
              })
              .then(() => {
                alert("อัปเดตข้อมูลสำเร็จ!");
                this.setState({
                  stdid: "",
                  stdtitle: "",
                  stdfname: "",
                  stdlname: "",
                  stdemail: "",
                  stdphone: "",
                });
                this.readData(); // โหลดข้อมูลใหม่หลังอัปเดต
              })
              .catch((error) => console.error("Error updating data: ", error));
          } else {
            // ถ้าไม่พบเอกสารให้เพิ่มข้อมูลใหม่
            db.collection("student")
              .doc(this.state.stdid) // ใช้ stdid ที่กรอกเป็น document ID
              .set({
                title: this.state.stdtitle || "",
                fname: this.state.stdfname || "",
                lname: this.state.stdlname || "",
                phone: this.state.stdphone || "",
                email: this.state.stdemail || "",
              })
              .then(() => {
                alert("เพิ่มข้อมูลสำเร็จ!");
                this.setState({
                  stdid: "",
                  stdtitle: "",
                  stdfname: "",
                  stdlname: "",
                  stdemail: "",
                  stdphone: "",
                });
                this.readData(); // โหลดข้อมูลใหม่หลังเพิ่ม
              })
              .catch((error) => console.error("Error inserting data: ", error));
          }
        })
        .catch((error) => console.error("Error getting document: ", error));
    } else {
      // ถ้าไม่มี stdid ให้เพิ่มข้อมูลใหม่
      db.collection("student")
        .doc(this.state.stdid) // ใช้ stdid ที่กรอกเป็น document ID
        .set({
          title: this.state.stdtitle || "",
          fname: this.state.stdfname || "",
          lname: this.state.stdlname || "",
          phone: this.state.stdphone || "",
          email: this.state.stdemail || "",
        })
        .then(() => {
          alert("เพิ่มข้อมูลสำเร็จ!");
          this.setState({
            stdid: "",
            stdtitle: "",
            stdfname: "",
            stdlname: "",
            stdemail: "",
            stdphone: "",
          });
          this.readData(); // โหลดข้อมูลใหม่หลังเพิ่ม
        })
        .catch((error) => console.error("Error inserting data: ", error));
    }
  }

  edit(std) {
    this.setState({
      stdid: std.id,
      stdtitle: std.title,
      stdfname: std.fname,
      stdlname: std.lname,
      stdemail: std.email,
      stdphone: std.phone,
    });
  }

  delete(std) {
    if (confirm("ต้องการลบข้อมูล")) {
      db.collection("student")
        .doc(std.id)
        .delete()
        .then(() => {
          // หลังจากลบข้อมูลจาก Firestore แล้ว ให้ลบข้อมูลออกจาก state ด้วย
          const updatedStudents = this.state.student.filter(
            (student) => student.id !== std.id
          );
          this.setState({ student: updatedStudents });
          alert("ลบข้อมูลสำเร็จ!");
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
          alert("เกิดข้อผิดพลาดในการลบข้อมูล!");
        });
    }
  }

  render() {
    // var stext = JSON.stringify(this.state.students);

    return (
      <Card className="max-w-4xl mx-auto my-8 shadow-lg rounded-lg bg-white">
        <Card.Header className="bg-blue-600 text-white text-xl font-semibold p-4">
          {this.title}
        </Card.Header>
        <Card.Body className="p-6">
          <LoginBox user={this.state.user} app={this} />
          <div className="flex justify-between space-x-4 mt-4">
            <Button
              variant="primary"
              onClick={() => this.readData()}
              className="w-32 py-2"
            >
              Read Data
            </Button>
            <Button
              variant="secondary"
              onClick={() => this.autoRead()}
              className="w-32 py-2"
            >
              Auto Read
            </Button>
          </div>
          <div className="mt-6">
            <StudentTable data={this.state.student} app={this} />
          </div>
        </Card.Body>
        <Card.Footer className="bg-gray-100 p-6">
          <b className="text-lg text-blue-600">เพิ่ม/แก้ไขข้อมูล นักศึกษา :</b>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="ID"
              app={this}
              value="stdid"
              style={{ width: "100%" }}
            />
            <TextInput
              label="คำนำหน้า"
              app={this}
              value="stdtitle"
              style={{ width: "100%" }}
            />
            <TextInput
              label="ชื่อ"
              app={this}
              value="stdfname"
              style={{ width: "100%" }}
            />
            <TextInput
              label="สกุล"
              app={this}
              value="stdlname"
              style={{ width: "100%" }}
            />
            <TextInput
              label="Email"
              app={this}
              value="stdemail"
              style={{ width: "100%" }}
            />
            <TextInput
              label="Phone"
              app={this}
              value="stdphone"
              style={{ width: "100%" }}
            />
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => this.insertOrUpdateData()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {this.state.stdid ? "Update" : "Save"}
            </Button>
          </div>
        </Card.Footer>
        <Card.Footer className="p-4 bg-gray-50">{this.footer}</Card.Footer>
      </Card>
    );

  }
}

// Render React App
const container = document.getElementById("myapp");
const root = ReactDOM.createRoot(container);
root.render(<App />);
