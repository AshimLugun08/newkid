import * as React from "react";
import {
  TextField,
  DatePicker,
  DefaultButton,
  PrimaryButton,
  Spinner,
  Dropdown,
} from "office-ui-fabric-react";
import axios from "axios";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { baseAPI, baseURL } from "./EnvironmentVariables";
import { Box, Modal } from "@mui/material";
import { IDropdownOption } from "@fluentui/react";

interface NewRegistrationFormProps {
  isOpen: boolean;
  ALLdata: any;
  onDismiss: () => void;
  onSaveSuccess: () => void;
}

interface NewRegistrationFormState {
  uhid: string;
  firstName: string;
  lastName: string;
  selectedDate: Date;
  gender: string;
  parentsName: string;
  relation: string;
  contactCountryCode: string;
  contact: string;
  whatsappCountryCode: string;
  whatsapp: string;
  email: string;
  address: string;
  state: string;
  city: string;
  pin: string;
  copyPhoneNumber: boolean;
  loading: boolean;
  saveClicked: boolean;
}

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 2,
};

class NewRegistrationForm extends React.Component<NewRegistrationFormProps, NewRegistrationFormState> {
  constructor(props: NewRegistrationFormProps) {
    super(props);
    this.state = {
      uhid: "",
      firstName: "",
      lastName: "",
      selectedDate: new Date(),
      gender: "Male",
      parentsName: "",
      relation: "Father",
      contactCountryCode: "+91",
      contact: "",
      whatsappCountryCode: "+91",
      whatsapp: "",
      email: "",
      address: "",
      state: "",
      city: "",
      pin: "",
      copyPhoneNumber: false,
      loading: false,
      saveClicked: false
    };
  }

  componentDidUpdate(prevProps: NewRegistrationFormProps, prevState: NewRegistrationFormState) {
    if (this.state.pin !== prevState.pin && this.state.pin.length === 6 && !isNaN(Number(this.state.pin))) {
      this.fetchLocationInfo(this.state.pin);
    }
  }

  get formattedDate() {
    return this.state.selectedDate
      ? new Date(
          this.state.selectedDate.getTime() - this.state.selectedDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0]
      : "";
  }

  handleGenderChange = (ev: React.ChangeEvent<HTMLInputElement>, newValue: string) => {
    this.setState({ gender: newValue });
  };

  fetchLocationInfo = async (pin: string) => {
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0 && data[0].Status === "Success") {
        const locationData = data[0].PostOffice[0];
        this.setState({
          state: locationData.State,
          city: locationData.District
        });
      } else {
        console.error("Invalid PIN or no data found.");
      }
    } catch (error) {
      console.error("Error fetching location info:", error);
    }
  };

  GetUserName = async () => {
    const response = await axios.get("/_api/web/currentuser");
    return response.data.Email;
  };

  isUhidPresent = (uhidToCheck: any) => {
    return this.props.ALLdata.some((item: { uhid: any }) => item.uhid === uhidToCheck);
  };

  registerKid = async (parentID_new: string) => {
    try {
      const imageResponse = await fetch(require("../assets/p.png"));
      const imageBlob = await imageResponse.blob();
      const url = `${baseAPI()}/registerkid`;

      const formData = new FormData();
      formData.append("Parent_Profile_Id", parentID_new);
      formData.append("UHID", this.state.uhid);
      formData.append("Name", `${this.state.firstName} ${this.state.lastName}`);
      formData.append("Gender", this.state.gender);
      formData.append("DOB", this.formattedDate);
      formData.append("Image", imageBlob, "images.png");
      formData.append("upload_by", await this.GetUserName());

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "text/plain",
        },
      });

      this.setState({ loading: false, saveClicked: false });
      this.props.onSaveSuccess();
      alert(" Registration Successful. Opening Pediatrics History Form !");
      window.location.href = `${baseURL()}/Pediatrics-History-Form.aspx?kid_Id=${response.data.id}`;

    } catch (error) {
      console.error(error);
      this.setState({ loading: false, saveClicked: true });
      this.props.onDismiss();
      alert("Registration Failed !!");
      throw error;
    }
  };

  SaveRegistrationForm = async () => {
    try {
      this.setState({ saveClicked: true });

      if (
        this.state.firstName === "" ||
        this.state.lastName === "" ||
        this.state.contact.length !== 10 ||
        this.state.parentsName === ""
      ) {
        alert("Required Fields are Empty!");
        return;
      }

      this.setState({ loading: true });
      const imageResponse = await fetch(require("../assets/Kid.png"));
      const imageBlob = await imageResponse.blob();

      let data = new FormData();
      data.append("UHID", "0000");
      data.append("Name", this.state.parentsName);
      data.append("Relation", this.state.relation);
      data.append("Email", this.state.email || "-");
      data.append("Phone", `${this.state.contactCountryCode}${this.state.contact}`);
      data.append(
        "Whatsapp",
        this.state.whatsapp ? `${this.state.whatsappCountryCode}${this.state.whatsapp}` : "-"
      );
      data.append("Address", this.state.address || "-");
      data.append("City", this.state.city || "-");
      data.append("State", this.state.state || "-");
      data.append("Pincode", this.state.pin || "-");
      data.append("Upload_By", await this.GetUserName());
      data.append("Image", imageBlob, "Kid.png");

      let config = {
        method: "post",
        url: `${baseAPI()}/register`,
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "text/plain",
        },
        data: data,
      };

      const response = await axios(config);
      const parentID = response.data.id;
      await this.registerKid(parentID);

    } catch (error) {
      console.error(error);
      this.setState({ loading: false });
      alert("Registration Failed !");
      this.props.onDismiss();
    }
  };

  handleCopyPhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    this.setState({ 
      copyPhoneNumber: checked,
      whatsapp: checked ? this.state.contact : ""
    });
  };

  render() {
    const { isOpen, onDismiss } = this.props;
    const {
      uhid, firstName, lastName, selectedDate, gender, parentsName,
      relation, contactCountryCode, contact, whatsappCountryCode,
      whatsapp, email, address, state, city, pin, copyPhoneNumber,
      loading, saveClicked
    } = this.state;

    return (
      <Modal
        open={isOpen}
        onClose={onDismiss}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <label
            style={{
              fontWeight: "bold",
              color: "#53bf9d",
              display: "flex",
              alignItems: "center",
              justifyItems: "center",
            }}
          >
            New Patient Registration
          </label>
          <div style={{ padding: "5px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: "13px" }}>
                UHID<span style={{ color: "red" }}>*</span>
              </label>
              <TextField
                errorMessage={
                  this.isUhidPresent(uhid)
                    ? "UHID already Exist !"
                    : (uhid && uhid.length < 10) || (saveClicked && uhid.length < 10)
                      ? "Enter valid UHID !"
                      : ""
                }
                value={uhid}
                onChange={(e, newValue) => this.setState({ uhid: newValue ?? "" })}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "7px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginRight: "10px" }}>
                  <label style={{ fontSize: "13px" }}>
                    First Name<span style={{ color: "red" }}>*</span>
                  </label>
                  <TextField
                    value={firstName}
                    onChange={(e, newValue) => this.setState({ firstName: newValue || "" })}
                    errorMessage={saveClicked && firstName === "" ? "First name is required !" : ""}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px" }}>
                    Last Name<span style={{ color: "red" }}>*</span>
                  </label>
                  <TextField
                    value={lastName}
                    onChange={(e, newValue) => this.setState({ lastName: newValue || "" })}
                    errorMessage={saveClicked && lastName === "" ? "Last name required !" : ""}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "7px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginRight: "10px" }}>
                  <label style={{ fontSize: "13px" }}>
                    Date of Birth<span style={{ color: "red" }}>*</span>
                  </label>
                  <DatePicker
                    firstDayOfWeek={1}
                    showWeekNumbers={false}
                    firstWeekOfYear={1}
                    showMonthPickerAsOverlay={true}
                    placeholder="Select date"
                    onSelectDate={(date: Date) => this.setState({ selectedDate: date })}
                    value={selectedDate}
                    styles={{ textField: { textAlign: "left" } }}
                    maxDate={new Date()}
                    formatDate={(date: Date) => date.toLocaleDateString()}
                    style={{ width: "177px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px" }}>
                    Gender<span style={{ color: "red" }}>*</span>
                  </label>
                  <RadioGroup
                    value={gender}
                    onChange={this.handleGenderChange}
                    row
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    style={{
                      gap: "15px",
                      fontFamily: "Segoe UI",
                      fontSize: "14px",
                    }}
                  >
                    <FormControlLabel
                      value="Male"
                      control={<Radio />}
                      label="Male"
                    />
                    <FormControlLabel
                      value="Female"
                      control={<Radio />}
                      label="Female"
                    />
                  </RadioGroup>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "7px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginRight: "10px" }}>
                  <label style={{ fontSize: "13px" }}>
                    Parent's Name<span style={{ color: "red" }}>*</span>
                  </label>
                  <TextField
                    value={parentsName}
                    onChange={(e, newValue) => this.setState({ parentsName: newValue || "" })}
                    errorMessage={saveClicked && parentsName === "" ? "Parent name required !" : ""}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px" }}>
                    Relation<span style={{ color: "red" }}>*</span>
                  </label>
                  <Dropdown
                    options={[
                      { key: "Mother", text: "Mother" },
                      { key: "Father", text: "Father" },
                    ]}
                    selectedKey={relation}
                    onChange={(e, option: any) => this.setState({ relation: option?.key || "" })}
                    style={{ width: "177px" }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: "7px",
                  justifyContent: "space-between",
                  flexDirection: "column",
                }}
              >
                <label style={{ fontSize: "13px" }}>
                  Country Code & Phone Number<span style={{ color: "red" }}>*</span>
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ marginRight: "10px" }}>
                    <Dropdown
                      options={[{ key: "+91", text: "+91 (India)" }]}
                      selectedKey={contactCountryCode}
                      onChange={(e, option: any) => this.setState({ contactCountryCode: option?.key || "" })}
                      style={{ width: "120px" }}
                    />
                  </div>
                  <div>
                    <TextField
                      placeholder="Enter 10 digit mobile number"
                      value={contact}
                      onChange={(e, newValue) => {
                        const sanitizedValue = (newValue || "").replace(/[^0-9]/g, "");
                        this.setState({ contact: sanitizedValue });
                      }}
                      style={{ width: "240px" }}errorMessage={
                        (saveClicked && contact.length !== 10) ||
                        (contact && contact.length !== 10)
                          ? "Enter a valid phone number !"
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex" }}>
                <input
                  type="checkbox"
                  checked={copyPhoneNumber}
                  onChange={this.handleCopyPhoneNumberChange}
                />
                <label
                  style={{
                    marginLeft: "5px",
                    marginTop: "13px",
                    fontSize: "13px",
                  }}
                >
                  My WhatsApp number is the same as my phone number
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: "7px",
                  justifyContent: "space-between",
                }}
              >
                <label style={{ fontSize: "13px" }}>
                  WhatsApp Country Code & Number
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ marginRight: "10px" }}>
                  <Dropdown
  options={[{ key: "+91", text: "+91 (India)" }]}
  selectedKey={whatsappCountryCode}
  onChange={(e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => 
    this.setState({ whatsappCountryCode: option?.key?.toString() || "" })}
  style={{ width: "120px" }}
/>
                  </div>
                  <div>
                    <TextField
                      placeholder="Enter 10 digit mobile number"
                      value={copyPhoneNumber ? contact : whatsapp}
                      onChange={(e, newValue) => {
                        const sanitizedValue = (newValue || "").replace(/[^0-9]/g, "");
                        this.setState({ whatsapp: sanitizedValue });
                      }}
                      style={{ width: "240px" }}
                      errorMessage={
                        whatsapp && whatsapp.length !== 10
                          ? "Enter a valid Whatsapp number !"
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "7px" }}>
                <label style={{ fontSize: "13px" }}>Email</label>
                <TextField
                  value={email}
                  onChange={(e, newValue) => this.setState({ email: newValue || "" })}
                  placeholder="example@email.com"
                  errorMessage={
                    email && !isValidEmail(email)
                      ? "Enter a valid Email address!"
                      : ""
                  }
                />
              </div>

              <div style={{ marginTop: "7px" }}>
                <label style={{ fontSize: "13px" }}>Address</label>
                <TextField
                  multiline
                  rows={2}
                  value={address}
                  onChange={(e, newValue) => this.setState({ address: newValue || "" })}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "7px",
                }}
              >
                <div style={{ marginRight: "10px" }}>
                  <TextField
                    placeholder="State"
                    value={state}
                    onChange={(e, newValue) => this.setState({ state: newValue || "" })}
                  />
                </div>
                <div style={{ marginRight: "10px" }}>
                  <TextField
                    placeholder="City"
                    value={city}
                    onChange={(e, newValue) => this.setState({ city: newValue || "" })}
                  />
                </div>
                <div>
                  <TextField
                    placeholder="e.g. 834004"
                    value={pin}
                    onChange={(e, newValue) => {
                      const sanitizedValue = (newValue || "").replace(/[^0-9]/g, "");
                      this.setState({ pin: sanitizedValue });
                    }}
                    errorMessage={
                      pin && pin.length < 6 ? "Enter a valid PIN !" : ""
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                }}
              >
                <DefaultButton onClick={onDismiss}>Cancel</DefaultButton>
                {!loading ? (
                  <div>
                    <PrimaryButton onClick={this.SaveRegistrationForm}>
                      Save
                    </PrimaryButton>
                  </div>
                ) : (
                  <div style={{ marginTop: "5px" }}>
                    <Spinner
                      label="Please Wait..."
                      ariaLive="assertive"
                      labelPosition="right"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    );
  }
}

export default NewRegistrationForm;

// Function to validate email address
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};