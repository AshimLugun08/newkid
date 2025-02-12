import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import axios from "axios";
import "@fontsource/roboto/700.css";
import ActionButton from "./ActionButton";
import { SPComponentLoader } from "@microsoft/sp-loader";
import { baseAPI } from "./EnvironmentVariables";

require("./custom.css");

SPComponentLoader.loadCss(
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
);
SPComponentLoader.loadCss(
  "https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css"
);

interface State {
  TodaysAppointmentsData: any[];
  Todaysdate: string;
  selectedKID_name: string;
  selectedKID_FatherName: string;
  radioBTN: boolean;
  loaderBlue: boolean;
  currentKid: string;
  UploadbuttonLOADING: boolean;
  VisitedbuttonLOADING: boolean;
  CancelbuttonLOADING: boolean;
  CancelconfirmDialogue: boolean;
  grothdialogie: boolean;
  modopenGrowth: boolean;
  LoggedUser: string;
  loading: boolean;
  weight: string;
  height: string;
  headCircumference: string;
  modelopenUpload: boolean;
  setfileurl: null | string;
  Type: string;
  selectedKID_parent_Name: string;
  selectedKID_parent_Id: string;
  selectedKID_Email: string;
  selectedKID_Contact: string;
}

export default class TodaysAppointmentList extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      TodaysAppointmentsData: [],
      Todaysdate: "",
      selectedKID_name: "",
      selectedKID_FatherName: "",
      radioBTN: false,
      loaderBlue: false,
      currentKid: "",
      UploadbuttonLOADING: false,
      VisitedbuttonLOADING: false,
      CancelbuttonLOADING: false,
      CancelconfirmDialogue: false,
      grothdialogie: false,
      modopenGrowth: false,
      LoggedUser: "",
      loading: false,
      weight: "",
      height: "",
      headCircumference: "",
      modelopenUpload: false,
      setfileurl: null,
      Type: "",
      selectedKID_parent_Name: "",
      selectedKID_parent_Id: "",
      selectedKID_Email: "",
      selectedKID_Contact: "",
    };
  }

  handleGrowthOpen = () => this.setState({ modopenGrowth: true });
  handleGrowthClose = () => this.setState({ modopenGrowth: false });
  handleUploadClick = () => this.setState({ modelopenUpload: true });
  handleUploadClickClose = () => this.setState({ modelopenUpload: false });

  async componentDidMount() {
    await this.GetUserName();
    await this.getCurrentDate();
    await this.GetTodaysAppointment();
    
    document.addEventListener("sharedMessageSet", this.handleSharedMessage);
  }

  handleSharedMessage = async (event: Event) => {
    console.log("hi from trigger");
    
    const sharedMessage = (event as CustomEvent).detail;
    if (sharedMessage) {
      let dataRCV = sharedMessage;
      
      // Update state directly instead of using context
      this.setState({
        selectedKID_name: dataRCV[1],
        selectedKID_FatherName: dataRCV[3],
      });
      
      await this.GetTodaysAppointment_Kid(dataRCV[0], dataRCV[2]);
      console.log("finished");
    } else {
      await this.GetTodaysAppointment();
    }
  };

  componentWillUnmount() {
    document.removeEventListener("sharedMessageSet", this.handleSharedMessage);
  }
  formatDate(inputDate: string | number | Date) {
    const date = new Date(inputDate);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  GetUserName = async () => {
    const response = await axios.get("/_api/web/currentuser");
    const userTitle = response.data.Email;
    this.setState({ LoggedUser: userTitle });
    // console.log(userTitle);
  };
  getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed, so we add 1
    const day = String(today.getDate()).padStart(2, "0");
    this.setState({
      Todaysdate: `${year}-${month}-${day}`,
    });
    // console.log(this.state.Todaysdate);
  };

  convertTo12HourFormat = (time24: any) => {
    const [hour, minute] = time24.split(":");
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12; // 0 should become 12
    const time12 = `${hour12}:${minute} ${period}`;
    return time12;
  };

  GetTodaysAppointment = async () => {
    this.setState({
      TodaysAppointmentsData: [],
      radioBTN: false,
      loaderBlue: true,
    });
    const url = `${baseAPI()}/getappointments?start=${
      this.state.Todaysdate
      }&end=${this.state.Todaysdate}`;
    // console.log(url);
    try {
      const response = await axios.get(url);
      const TodaysAppointmentList = response.data.data;

      const modifiedData = await Promise.all(
        TodaysAppointmentList.map(
          async (item: { kid_Id: any; appointment_Id: any; reason: any; bed_number: any; }) => {
            let kidData = [];
            kidData = await this.getKidAllInfo(item.kid_Id);

            const kid_Symptoms = await this.getSymptoms(
              item.kid_Id,
              item.appointment_Id
            );
            return {
              ...item,
              Kid_Photo: kidData.photo,
              parent_Name: kidData.parent_Name,
              parent_Id: kidData.parent_Id,
              Kid_Email: kidData.email,
              Kid_Contact: kidData.phone,
              Kid_Symptoms: kid_Symptoms,
              reason: item.reason,
              bed_number: item.bed_number,
            };
          }
        )
      );
      this.setState({ TodaysAppointmentsData: modifiedData });
      this.setState({ loaderBlue: false });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      this.setState({ loaderBlue: false });
    }
  };

  GetTodaysAppointment_Kid = async (KIDID: any, KidPhoto: any) => {
    this.setState({ loaderBlue: true });
    this.setState({ TodaysAppointmentsData: [], radioBTN: true });
    const url = `${baseAPI()}/getappointmentsforkids?kid_id=${KIDID}`;
    // console.log(url);
    try {
      const response = await axios.get(url);
      const TodaysAppointmentList = response.data.data;

      const modifiedData = await Promise.all(
        TodaysAppointmentList.map(
          async (item: { kid_Id: any; appointment_Id: any, reason: any, bed_number: any }) => {
            const kid_Photo = KidPhoto;
            const kid_Symptoms = await this.getSymptoms(
              item.kid_Id,
              item.appointment_Id
            );
            return {
              ...item,
              Kid_Photo: kid_Photo,
              Kid_Symptoms: kid_Symptoms,
              reason: item.reason,
              bed_number: item.bed_number,
            };
          }
        )
      );

      this.setState({ TodaysAppointmentsData: modifiedData });
      this.setState({ loaderBlue: false });
      // // console.log(JSON.stringify(this.state.TodaysAppointmentsData));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      this.setState({ loaderBlue: false });
    }
  };

  getKidAllInfo = async (kidid: any) => {
    const url = `${baseAPI()}/getkidbyid?kid_id=${kidid}`;
    try {
      const response = await axios.get(url);
      // const kidDP = response.data.photo;
      // console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      return null; // You might want to handle this error more gracefully
    }
  };

  getSymptoms = async (Kidid: any, appontmentID: any) => {
    const url = `${baseAPI()}/getsymptomsforkid?kid_id=${Kidid}`;
    try {
      const response = await axios.get(url);
      const symptomsData = response.data.symptoms;
      const filteredSymptoms = symptomsData.filter(
        (symptom: { appointment_Id: string }) =>
          symptom.appointment_Id === appontmentID
      );
      const symptomNames = filteredSymptoms.map(
        (symptom: { symptom: any }) => symptom.symptom
      );

      return symptomNames;
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      return null; // You might want to handle this error more gracefully
    }
  };

  compareTimes(appointmentStartTime: any) {
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentSeconds = currentTime.getSeconds();
    const [appointmentHours, appointmentMinutes, appointmentSeconds] =
      appointmentStartTime.split(":").map(Number);
    const currentTotalSeconds =
      currentHours * 3600 + currentMinutes * 60 + currentSeconds;
    const appointmentTotalSeconds =
      appointmentHours * 3600 + appointmentMinutes * 60 + appointmentSeconds;
    if (currentTotalSeconds > appointmentTotalSeconds) {
      // console.log("The appointment is in the past.");
      return true;
    } else if (currentTotalSeconds < appointmentTotalSeconds) {
      // console.log("The appointment is upcoming.");
      return false;
    } else {
      // console.log("Present Appointment");
    }
  }

  UploadModalClose = async () => {
    await this.GetTodaysAppointment();
  };

  render() {
    if (this.state.loaderBlue) {
      return (
        <div
          style={{ display: "flex", marginTop: "287px", marginLeft: "151px" }}
        >
          <CircularProgress />
        </div>
      );
    } else {
      if (this.state.TodaysAppointmentsData.length !== 0) {
        return (
          <div style={{ width: "100%", maxWidth: "90%" }} className="MainDivCon">
            <List sx={{ width: "100%", maxWidth: 370, marginLeft: "5px" }}>
              <div
                style={{
                  textAlign: "center",
                  marginRight: "30px",
                  color: "#235ac3",
                  textDecorationThickness: "from-font",
                }}
              >
                <p
                  style={{
                    color: "#F94C66",
                    fontSize: "24px",  // Increased from 20px
                    fontWeight: "500",
                  }}
                >
                  {this.state.radioBTN
                    ? `${this.state.selectedKID_name}'s Appointments`
                    : `Today's Appointment List`}
                </p>
              </div>
              {this.state.TodaysAppointmentsData.map((item: any) => (
                <React.Fragment key={item.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar
                        style={{
                          height: "50px",
                          width: "50px",
                          marginRight: "20px",
                        }}
                        alt="Profile Picture"
                        src={item.Kid_Photo}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <div className="ListKidName" style={{ fontSize: "16px" }}>  {/* Added fontSize */}
                          {item.kid_Name}
                        </div>
                      }
                      secondary={
                        <React.Fragment>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px" }}>  {/* Added fontSize */}
                            Date: {this.formatDate(item.appointment_Date)}
                            <Chip
                              style={{ marginLeft: "10px", fontSize: "12px" }}  // Increased from 11px
                              label={
                                item.status === "Completed"
                                  ? "Completed"
                                  : item.status === "Not_Visited"
                                    ? "Not Visited"
                                    : item.status === "Cancelled"
                                      ? "Cancelled"
                                      : item.status === "Book"
                                        ? "Booked"
                                        : "Blocked"
                              }
                              color={
                                item.status === "Completed"
                                  ? "success"
                                  : item.status === "Not_Visited"
                                    ? "error"
                                    : item.status === "Cancelled"
                                      ? "error"
                                      : item.status === "Block"
                                        ? "warning"
                                        : "primary"
                              }
                              variant="outlined"
                              size="small"
                            />
                          </div>

                          <p style={{ display: "inline", fontSize: "14px" }}>  {/* Added fontSize */}
                            {this.convertTo12HourFormat(
                              item.appointment_Start_Time
                            ) +
                              " - " +
                              this.convertTo12HourFormat(
                                item.appointment_End_Time
                              )}
                          </p>
                          <p style={{ color: "#056db5", fontSize: "14px" }}>  {/* Added fontSize */}
                            {item.type === "Offline"
                              ? "(Walk-in)"
                              : "(Teleconsultation)"}
                          </p>

                          <p style={{ fontSize: "14px" }}>  {/* Added fontSize */}
                            {
                              item.reason === "In-Patient"
                              &&
                              `In-Patient(Bed No: ${item.bed_number})`
                            }
                          </p>

                          <div style={{ fontSize: "13px" }}>  {/* Increased from 12px */}
                            {item.Kid_Symptoms.length !== 0 ? (
                              <>
                                <span style={{ fontWeight: "bold" }}>
                                  Symptoms:
                                </span>
                                {item.Kid_Symptoms.join(", ")}
                              </>
                            ) : (
                              ""
                            )}
                          </div>
                        </React.Fragment>
                      }
                    />

                    <div style={{ width: "50px" }}>
                      <div>
                        <ActionButton
                          kid_Id={item.kid_Id}
                          Kid_Name={
                            this.state.radioBTN
                              ? this.state.selectedKID_name
                              : item.kid_Name
                          }
                          parent_Name={
                            this.state.radioBTN
                              ? this.state.selectedKID_FatherName
                              : item.parent_Name
                          }
                          parent_Id={item.parent_Id}
                          Kid_Email={item.Kid_Email}
                          Kid_Contact={item.Kid_Contact}
                          appointment_Id={item.appointment_Id}
                          appointment_date={this.formatDate(
                            item.appointment_Date
                          )}
                          appointment_Time={this.convertTo12HourFormat(
                            item.appointment_Start_Time
                          )}
                          appointment_Type={item.type}
                          appointmentStatus={item.status}
                          onCLOSE={this.UploadModalClose}
                        ></ActionButton>
                      </div>
                    </div>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </div>
        );
      } else {
        return (
          <div className="FixWidth">
            <div></div>
            <h5 style={{ color: "#F94C66", fontSize: "16px" }}>  {/* Added fontSize */}
              No appointments scheduled for today...
            </h5>
          </div>
        );
        
      }
    }
  }
}
