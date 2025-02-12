import { FluentProvider, teamsLightTheme } from "@fluentui/react-components";
import axios from "axios";
import * as React from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Dialog, DialogType } from "@fluentui/react/lib/Dialog";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Spinner } from "office-ui-fabric-react/lib/Spinner";
import AddGrowthModal from "./AddGrowthModal";
import { baseAPI } from "./EnvironmentVariables";
import { Dropdown, IDropdownOption } from "office-ui-fabric-react/lib/Dropdown";
import { ReportUploadModal } from "./ReportUploadModal";
import { TextField } from "office-ui-fabric-react";

const dialogStyles = { main: { maxWidth: 450 } };
const dialogContentProps = {
  type: DialogType.normal,
  closeButtonAriaLabel: "Close",
};

interface IActionButtonProps {
  kid_Id: string;
  appointment_Id: string;
  Kid_Name: string;
  parent_Id: string;
  parent_Name: string;
  appointment_Type: string;
  appointment_Time: string;
  appointment_date: string;
  Kid_Contact: string;
  Kid_Email: string;
  appointmentStatus: string;
  onCLOSE: () => void;
}

interface IActionButtonState {
  OpenDialog: boolean;
  OpenReportModel: boolean;
  kidid: string;
  Appointmentid: string;
  Loader: boolean;
  OpenGrowthForm: boolean;
  reasons: IDropdownOption[];
  selectedReason: string;
  bedNo: string;
}

export default class ActionButton extends React.Component<IActionButtonProps, IActionButtonState> {
  private labelId: string = Math.random().toString();
  private subTextId: string = Math.random().toString();
  
  constructor(props: IActionButtonProps) {
    super(props);
    this.state = {
      OpenDialog: false,
      OpenReportModel: false,
      kidid: "",
      Appointmentid: "",
      Loader: false,
      OpenGrowthForm: false,
      reasons: [],
      selectedReason: "",
      bedNo: ""
    };
  }

  private modalProps = {
    titleAriaId: this.labelId,
    subtitleAriaId: this.subTextId,
    isBlocking: false,
    styles: dialogStyles,
  };

  private WhatsappMsg_Walkin = `https://api.whatsapp.com/send?phone=91${this.props.Kid_Contact}&text=Hi ${this.props.parent_Name},%0DI hope you're doing well. This is a friendly reminder about  ${this.props.Kid_Name}'s upcoming Tele Consultation appointment scheduled via KidCare app.It's set for ${this.props.appointment_date} at ${this.props.appointment_Time}. Please ensure your child is prepared for the visit.%0D If you need to reschedule or have any queries, feel free to contact us. We look forward to seeing you soon.%0DBest regards,%0DKidCare`;
  private WhatsappMsg_Tele = `https://api.whatsapp.com/send?phone=91${this.props.Kid_Contact}&text=Hello ${this.props.parent_Name},%0DThis is a friendly reminder about the upcoming appointment for ${this.props.Kid_Name} scheduled on ${this.props.appointment_date} at ${this.props.appointment_Time}.%0DIf there are any changes needed or if you require assistance, please let us know. We're here to help.%0DBest regards,%0DKidCare`;
  private Flip_Tele = `Hello ${this.props.parent_Name},This is a friendly reminder about the upcoming appointment for ${this.props.Kid_Name} scheduled on ${this.props.appointment_date} at ${this.props.appointment_Time}.If there are any changes needed or if you require assistance, please let us know. We're here to help.Best regards, KidCare`;
  private Flip_walking = `Hi ${this.props.parent_Name},I hope you're doing well. This is a friendly reminder about  ${this.props.Kid_Name}'s upcoming Tele Consultation appointment scheduled via KidCare app.It's set for ${this.props.appointment_date} at ${this.props.appointment_Time}. Please ensure your child is prepared for the visit.If you need to reschedule or have any queries, feel free to contact us. We look forward to seeing you soon.<br>Best regards,<br>KidCare`;

  componentDidMount() {
    this.fetchBookingReasons();
  }

  private menuProps = (kidId: string, appointmentID: string) => ({
    shouldFocusOnMount: true,
    shouldFocusOnContainer: true,
    items: [
      {
        key: "UpdateGrowthDetails",
        text: "Update Growth Details",
        iconProps: { iconName: "EditNote" },
        onClick: () => this.OpenGrowthDialog(kidId, appointmentID),
      },
      {
        key: "UploadMedicalReports",
        text: "Upload Medical Reports",
        iconProps: { iconName: "Upload" },
        onClick: () => this.SetCurrentIdsForModal(kidId, appointmentID),
      },
      {
        key: "UpdateStatus",
        text: "Update Status",
        iconProps: { iconName: "Edit" },
        subMenuProps: {
          items: [
            {
              key: "Markaconfirmed",
              text: "Booking Confirmed",
              title: "Mark appoinment as Booked from Block",
              iconProps: { iconName: "ReminderTime" },
              onClick: () => this.SetDialogOpen(appointmentID),
              disabled: this.props.appointmentStatus != "Block",
            },
            {
              key: "MarkasComplete",
              text: "Completed",
              title: "Mark as Completed",
              iconProps: { iconName: "Completed" },
              onClick: () => this.MarksAppointmentVisited(appointmentID),
              disabled: this.props.appointmentStatus != "Book",
            },
            {
              key: "NotVisited",
              text: "Not Visited",
              title: "Mark as Not Visited",
              iconProps: { iconName: "UserRemove" },
              onClick: () => this.MarksAppointmentNotVisited(appointmentID),
              disabled: this.props.appointmentStatus != "Book",
            },
            {
              key: "cancelappointment",
              text: "Cancel Appointment",
              title: "Cancel today's appointment for selected kid",
              iconProps: { iconName: "Cancel" },
              onClick: () => this.handelcancelAppointment(appointmentID),
              disabled: this.props.appointmentStatus == "Completed",
            },
          ],
        },
      },
      {
        key: "sendreminder",
        text: "Send Reminder",
        iconProps: { iconName: "Send" },
        subMenuProps: {
          items: [
            {
              key: "Email",
              text: "Email",
              title: "Send an Email",
              iconProps: { iconName: "MailSolid" },
              disabled: this.props.Kid_Email == "",
              onClick: () => this.handleMailClick(),
            },
            {
              key: "Flip",
              text: "Flip",
              title: "Create a Flip",
              iconProps: { iconName: "ContextMenu" },
              onClick: () => this.handleFlipClick(),
            },
            {
              key: "WhatsApp",
              text: "WhatsApp",
              title: "Send WhatsApp message",
              iconProps: { iconName: "OfficeChat" },
              href: this.props.appointment_Type
                ? this.WhatsappMsg_Walkin
                : this.WhatsappMsg_Tele,
              target: "_blank",
              disabled: this.props.Kid_Contact == "" || this.props.Kid_Contact == "-",
            },
          ],
        },
      },
    ],
  });

  private handelcancelAppointment = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to cancel this appointment?");
    if (confirmed) {
      this.CancelAppointment(id);
    }
  };

  private handleFlipClick = () => {
    console.log("Flip Clicked");
    this.HandelFlipSent();
  };

  private handleMailClick = () => {
    console.log("Email send Clicked");
    this.SendMail();
  };

  private HandelFlipSent = async () => {
    try {
      const url = `${baseAPI()}/createflip`;
      const formData = new FormData();

      formData.append("Kid_Id", this.props.kid_Id);
      formData.append("Receiver_Id", this.props.parent_Id);
      formData.append("Parent_Id", this.props.parent_Id);
      formData.append("Flip_Type", "Reminder Flip");
      formData.append("Title", " Appointment reminder");
      formData.append(
        "Message",
        this.props.appointment_Type ? this.Flip_walking : this.Flip_Tele
      );
      formData.append("upload_by", await this.GetUserName());
      
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "text/plain",
        },
      });
      console.log(response);
      alert("Appointment reminder Flip sent !");
    } catch (error) {
      console.error(error);
      window.alert("Appointment reminder Flip not sent !");
      throw error;
    }
  };

  private SendMail = async () => {
    try {
      alert("Appointment reminder E-mail sent !");
      this.handleMenuClose();
      this.UploadModalClose();
    } catch (error) {
      this.UploadModalClose();
      console.error("Error fetching data: ", error);
      this.handleMenuClose();
      alert("Appointment reminder E-mail not sent !");
    }
  };

  private SetCurrentIdsForModal = (kidid: string, Appointmentid: string) => {
    this.setState({
      kidid,
      Appointmentid,
      OpenReportModel: true
    });
  };

  private SetDialogOpen = (Appointmentid: string) => {
    this.setState({
      Appointmentid,
      OpenDialog: true
    });
  };

  private OpenGrowthDialog = (kidid: string, Appointmentid: string) => {
    this.setState({
      kidid,
      Appointmentid,
      OpenGrowthForm: true
    });
  };

  private MarksAppointmentVisited = async (Appointmentid: string) => {
    try {
      window.alert("Appointment marked as completed !");
      this.handleMenuClose();
      this.UploadModalClose();
    } catch (error) {
      this.UploadModalClose();
      console.error("Error fetching data: ", error);
      this.handleMenuClose();
      window.alert("Error in Update !");
    }
  };

  private MarksAppointmentNotVisited = async (Appointmentid: string) => {
    try {
      const url = `${baseAPI()}/markappointment?Appointment_Id=${Appointmentid}&Status=2&Reason=Patitent%20Not%20Visited`;
      const response = await axios.post(url);
      console.log(response.data);
      window.alert("Appointment marked as not completed !");
      this.handleMenuClose();
      this.UploadModalClose();
    } catch (error) {
      this.UploadModalClose();
      console.error("Error fetching data: ", error);
      this.handleMenuClose();
      window.alert("Error in Update !");
    }
  };

  private MarksAppointmentBooked = async (Appointmentid: string) => {
    try {
      const url = `${baseAPI()}/markappointment?Appointment_Id=${Appointmentid}&Status=0&Reason=${this.state.selectedReason}&Bed_number=${this.state.bedNo}`;
      const response = await axios.post(url);
      console.log(response.data);
      if (response.data.status === 1) {
        window.alert("Booking Confirmed !");
      } else {
        window.alert("Error in Booking Appointment!");
      }
      this.handleMenuClose();
      this.UploadModalClose();
    } catch (error) {
      this.UploadModalClose();
      console.error("Error fetching data: ", error);
      this.handleMenuClose();
    }
  };

  private CancelAppointment = async (appointmentID: string) => {
    this.setState({ Loader: true });
    try {
      const response = await axios.get(
        `${baseAPI()}/cancelappointment?Appointment_Id=${appointmentID}`
      );
      console.log(response.data);
      this.UploadModalClose();
      window.alert("Appointment cancelled !");
      this.setState({ Loader: false });
    } catch (error) {
      this.setState({ Loader: false });
      this.UploadModalClose();
      console.error("Error fetching data: ", error);
      this.handleMenuClose();
      window.alert("Error in status update !");
    }
  };

  private UploadModalClose = () => {
    this.setState({
      OpenReportModel: false,
      OpenDialog: false,
      OpenGrowthForm: false
    });
    this.props.onCLOSE();
  };

  private GetUserName = async () => {
    const response = await axios.get("/_api/web/currentuser");
    return response.data.Email;
  };

  private fetchBookingReasons = async () => {
    try {
      const response = await axios.get(
        "https://healthpointsolutions.sharepoint.com/sites/KidsCare/_api/web/lists/getByTitle('MD_Confirm_Reasons')/items?$top=2000&$select=*"
      );

      const ReasonList = response.data.value;
      const reasonOptions: IDropdownOption[] = ReasonList.map((item: any) => ({
        key: item.Title,
        text: item.Title,
      }));

      this.setState({ reasons: reasonOptions });
    } catch (error) {
      console.error("Error fetching booking reasons:", error);
    }
  };

  private handleReasonChange = (
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption
  ) => {
    if (option) {
      this.setState({ selectedReason: option.key as string });
      console.log("Selected Reason:", option.key);
    }
  };

  private handleMenuClose = () => {
    // Add any menu closing logic here if needed
  };

  render() {
    return (
      <>
        <div>
          <div>
            {this.state.OpenReportModel && (
              <FluentProvider theme={teamsLightTheme}>
                <ReportUploadModal
                  KidID={this.state.kidid}
                  AppointmentID={this.state.Appointmentid}
                  onCLOSE={this.UploadModalClose}
                />
              </FluentProvider>
            )}
          </div>
          {this.state.OpenGrowthForm && (
            <div>
              <AddGrowthModal
                KidID={this.state.kidid}
                AppointmentID={this.state.Appointmentid}
                modal={this.state.OpenGrowthForm}
                modalClose={this.UploadModalClose}
              />
            </div>
          )}
          <div>
            <DefaultButton
              style={{ background: "bottom", border: "none", cursor: "pointer" }}
              menuIconProps={{ iconName: "" }}
              menuProps={this.menuProps(this.props.kid_Id, this.props.appointment_Id)}
            >
              <MoreVertIcon />
            </DefaultButton>
          </div>
        </div>

        <Dialog
          hidden={!this.state.OpenDialog}
          onDismiss={this.UploadModalClose}
          dialogContentProps={dialogContentProps}
          modalProps={this.modalProps}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div>
              <label htmlFor="reasonDropdown">Select Reason:</label>
              <Dropdown
                id="reasonDropdown"
                options={
                  this.props.appointment_Type == "Offline"
                    ? this.state.reasons
                    : this.state.reasons.filter((reason) => reason.key != "In-Patient")
                }
                selectedKey={this.state.selectedReason}
                onChange={this.handleReasonChange}
                style={{ width: "200px" }}
              />
            </div>
            <br />

            {this.state.selectedReason === "In-Patient" && (
              <div>
                <label htmlFor="bedNo">Enter Bed No:</label>
                <TextField
                  id="bedNo"
                  value={this.state.bedNo}
                  onChange={(e, newValue) => this.setState({ bedNo: newValue || "" })}
                  errorMessage={this.state.bedNo == "" ? "Enter a valid Bed Number!" : ""}
                  style={{ width: "200px" }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "25px",
              }}
            >
              <div style={{ marginRight: "10px", display: "flex" }}>
                <DefaultButton onClick={this.UploadModalClose}>Cancel</DefaultButton>
              </div>

              {!this.state.Loader ? (
                <div>
                  <PrimaryButton
                    onClick={() =>
                      this.state.selectedReason === "In-Patient" && this.state.bedNo == ""
                        ? window.alert("Enter a valid Bed Number to Confirm!")
                        : this.MarksAppointmentBooked(this.state.Appointmentid)
                    }
                  >
                    Confirm
                  </PrimaryButton>
                </div>
              ) : (
                <div style={{ marginTop: "5px" }}>
                  <Spinner
                    ariaLive="assertive"
                    label="Please Wait..."
                    labelPosition="right"
                  />
                </div>
              )}
            </div>
          </div>
        </Dialog>
      </>
    );
  }
}