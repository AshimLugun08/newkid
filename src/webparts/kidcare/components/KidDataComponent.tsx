import * as React from "react";
import { DataGrid, GridLocaleText, GridToolbar } from "@mui/x-data-grid";
import "@fontsource/roboto/500.css";
import axios from "axios";
import NewRegistrationForm from "./NewRegistration";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { FluentProvider, teamsLightTheme } from "@fluentui/react-components";
import { ReportUploadModal } from "./ReportUploadModal";
import { PrimaryButton } from "office-ui-fabric-react";
import { VscAdd } from "react-icons/vsc";
import { styled } from "@mui/system";
import { gridClasses } from "@mui/x-data-grid";
import { GridColDef } from "@mui/x-data-grid";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { baseAPI, baseURL } from "./EnvironmentVariables";
import ReplyFlipModal from "./replyFlipModal";
import Badge from "@mui/material/Badge";
import MailIcon from "@mui/icons-material/Mail";
import PhoneIphoneSharp from "@mui/icons-material/PhoneIphoneSharp";
import LanguageIcon from "@mui/icons-material/Language";
import { Web as Web1 } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users";
import "@pnp/sp/attachments";

const baseUrl = "https://healthpointsolutions.sharepoint.com/sites/KidCare_Staging";
const KidPageUrl = `${baseURL()}/KidProfile.aspx`;
const ParentPAgeUrl = `${baseURL()}/ParentProfile.aspx`;

const StripedDataGrid = styled(DataGrid)(({ }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: "#d9d9d9c2",
  },
  "& .MuiDataGrid-toolbarContainer": {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "8px",
  },
}));

require("./mycss.css");

interface State {
  isRegistrationFormOpen: boolean;
  selectedKidId: string;
  RadioUIStatus: boolean;
  Clicked: boolean;
  allData: any[];
  isNewDataFetched: boolean;
  UploadModal: boolean;
  ActionSelectedKidId: any;
  ModalOpen: boolean;
  KidDetailData: any[];
  UnreadFlips: number;
}

export default class QuickFilteringGrid extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      isRegistrationFormOpen: false,
      selectedKidId: "",
      RadioUIStatus: false,
      Clicked: false,
      allData: [],
      isNewDataFetched: false,
      UploadModal: false,
      ActionSelectedKidId: false,
      ModalOpen: false,
      KidDetailData: [],
      UnreadFlips: 0
    };
  }

  componentDidMount() {
    this.fetchData();
    this.FetchAllFlip();
  }

  componentDidUpdate(prevProps: {}, prevState: State) {
    if (this.state.isNewDataFetched && !prevState.isNewDataFetched) {
      setTimeout(() => {
        this.setState({ isNewDataFetched: false });
      }, 30000);
    }
  }

  UploadModalClose = () => {
    this.setState({ UploadModal: false });
  };

  UploadModalOpen = (kidid___: any) => {
    this.setState({
      UploadModal: true,
      ActionSelectedKidId: kidid___
    });
  };

  openKidProfile = (kidId: any) => {
    window.location.href = `${KidPageUrl}?kid_Id=${kidId}`;
  };

  openPArentProfile = (P_Id: any) => {
    window.location.href = `${ParentPAgeUrl}?parent_Id=${P_Id}`;
  };

  handleRadioClick = (
    kidId: any,
    selectedkidName: any,
    kidPhoto: any,
    ParentName: any
  ) => {
    if (!this.state.Clicked) {
      this.setState({
        selectedKidId: kidId,
        Clicked: true,
        RadioUIStatus: true
      });
      const event = new CustomEvent("sharedMessageSet", {
        detail: [kidId, selectedkidName, kidPhoto, ParentName],
      });
      document.dispatchEvent(event);
    } else {
      this.setState({
        selectedKidId: "",
        Clicked: false,
        RadioUIStatus: false
      });
      const event = new CustomEvent("sharedMessageSet", {
        detail: null,
      });
      document.dispatchEvent(event);
    }
  };

  openRegistrationForm = () => {
    this.setState({ isRegistrationFormOpen: true });
  };

  closeRegistrationForm = () => {
    this.setState({ isRegistrationFormOpen: false });
    this.fetchData();
  };

  fetchData = async () => {
    const apiBaseUrl = baseAPI();
    try {
      this.setState({ isNewDataFetched: true });

      const response = await axios.get(apiBaseUrl + "/getallkids");
      const data = await Promise.all(
        response.data.data.map(async (item: any, index: number) => {
          try {
            const loginStatusResponse = await axios.get(
              `${baseAPI()}/MobileAppLoginStatus?ParentProfileId=${item.parent_Id}`
            );
          

            return {
              ...item,
              LoginStatus: loginStatusResponse.data.login,
              id: index + 1,
            };
          } catch (loginError) {
            console.error("Error fetching login status: ", loginError);
            return {
              ...item,
              LoginStatus: null,
              id: index + 1,
            };
          }
        })
      )
      console.log(data)

      this.setState({ allData: data });
    } catch (error) {
      console.error("Error fetching data: ", error);
      alert("Network Error !");
    }
  };

  GetUserName = async () => {
    const response = await axios.get("/_api/web/currentuser");
    return response.data.Email;
  };

  checkIfCurrentUserDoctor = (email: string) => {
    return new Promise((resolve, reject) => {
      try {
        let web = Web1(baseUrl);
        web.lists
          .getByTitle("MD_Flip_Emails")
          .items.select("Title", "Email")()
          .then((result: any[] | null | undefined) => {
            if (result != null || result != undefined) {
              let arr = result.filter((it: { Email: string; }) => it.Email === email);
              resolve(arr.length !== 0);
            }
          });
      } catch (ex) {
        reject(ex);
      }
    });
  };

  FetchAllFlip = async () => {
    try {
      let userName = await this.GetUserName();
      let isDoctor = await this.checkIfCurrentUserDoctor(userName);

      let apiUrlDoctor = `${baseAPI()}/getfliplistforcareteam?id=${userName}`;
      let apiUrlCarePartner = `${baseAPI()}/getfliplistforcareteam?id=${"Care_Partner"}`;

      let allFlipData: any[] = [];

      if (isDoctor) {
        const response = await axios.get(apiUrlDoctor);
        allFlipData = [...response.data.data];
      } else {
        userName = "Ila.Binaykia@healthpointranchi.com";
        apiUrlDoctor = `${baseAPI()}/getfliplistforcareteam?id=${userName}`;

        const response = await axios.get(apiUrlDoctor);
        const response2 = await axios.get(apiUrlCarePartner);
        allFlipData = [...response.data.data, ...response2.data.data];
      }

      const unreadFlips = allFlipData.filter(
        (flip: { read_flag: string }) => flip.read_flag.toLowerCase() === "false"
      );

      this.setState({ UnreadFlips: unreadFlips.length || 0 });
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  formatDateOfBirth = (dateOfBirth: string | undefined | null) => {
    if (!dateOfBirth) return "not found dob";
   
    
    try {
      console.log("found dob")
      console.log("dob",dateOfBirth)
      const parts = dateOfBirth.split(" ")[0].split("/");
      if (parts.length !== 3) return dateOfBirth;
      
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn("Error formatting date:", error);
      return dateOfBirth;
    }
  };

  BatchClicked = () => {
    window.location.href = `${baseURL()}/Flip-List.aspx`;
  };

  FlipComponentModal = (Data: any) => {
    this.setState({
      KidDetailData: Data,
      ModalOpen: true
    });
  };

  ModalCCloseCallback = () => {
    this.setState({ ModalOpen: false });
  };

  open_Pediatrics_form = (kid__Id: any) => {
    window.location.href = `${baseURL()}/Pediatrics-History-Form.aspx?kid_Id=${kid__Id}`;
  };

  open_Booking_form = (kid__Id: any) => {
    window.location.href = `${baseURL()}/BookAppointment.aspx?kid_Id=${kid__Id}`;
  };

  menuProps = (row: any) => ({
    shouldFocusOnMount: true,
    shouldFocusOnContainer: true,
    items: [
      {
        key: "bookappointment",
        text: "Book Appointment",
        iconProps: { iconName: "AddOnlineMeeting" },
        onClick: () => this.open_Booking_form(row.kid_Id),
      },
      {
        key: "pediatricform",
        text: "Pediatrics History Form",
        iconProps: { iconName: "EditNote" },
        onClick: () => this.open_Pediatrics_form(row.kid_Id),
      },
      {
        key: "uploadpastrecords",
        text: "Upload Past Records",
        iconProps: { iconName: "Upload" },
        onClick: () => this.UploadModalOpen(row.kid_Id),
      },
      {
        key: "SendFlip",
        text: "Send Flip",
        iconProps: { iconName: "ContextMenu" },
        onClick: () => this.FlipComponentModal(row),
      },
    ],
  });

  render() {
    const columns: GridColDef[] = [
      {
        field: "select",
        headerName: "",
        width: 3,
        renderCell: (params: any) => (
          <div
          onClick={(event) => {
            event.stopPropagation();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%", // Ensures it takes full height of the parent
          }}
        >
          <input
            type="checkbox"
            checked={params.row.kid_Id === this.state.selectedKidId && this.state.RadioUIStatus}
            onChange={() =>
              this.handleRadioClick(
                params.row.kid_Id,
                params.row.name,
                params.row.photo,
                params.row.parent_Name
              )
            }
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
              appearance: "none",
              border: "1px solid #ccc",
              fontSize: "15px",
              borderRadius: "2px",
              background:
                params.row.kid_Id === this.state.selectedKidId && this.state.RadioUIStatus
                  ? "lightblue"
                  : "white",
            }}
          />
        </div>
        
        ),
      },
      
      { field: "id", headerName: "Sl. No.", width: 60 },
      { field: "uhid", headerName: "UHID", width: 110 },
      {
        field: "name",
        headerName: "Name",
        width: 150,
        renderCell: (params: any) => (
          <div
            onClick={() => this.openKidProfile(params.row.kid_Id)}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
              color: "#056DB5",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            {params.value}
          </div>
        ),
      },
      { field: "gender", headerName: "Gender", width: 70 },
      {
        field: "dob",
        headerName: "Date Of Birth",
        width: 100,
        valueGetter: (params: any) => {
          console.log("dob");
          console.log(params)
          if (!params) return "not found dob";
          return this.formatDateOfBirth(params);
        }
      },
      {
        field: "parent_Name",
        headerName: "Parent's Name",
        width: 140,
        renderCell: (params: any) => (
          <div
            onClick={() => this.openPArentProfile(params.row.parent_Id)}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
              textDecoration: "none",
              color: "#056DB5",
              cursor: "pointer",
            }}
          >
            {params.value}
          </div>
        ),
      },
      { field: "phone", headerName: "Contact", width: 110 },
      {
        field: "app_Login_Code",
        headerName: "App Login Code",
        width: 100,
        renderCell: (params: any) => {
          const [showCode, setShowCode] = React.useState(false);

          return (
            <div
              style={{
                display: "flex",
                gap: "5px",
                alignItems: "center",
              }}
            >
              
              <div
                onClick={() => setShowCode(!showCode)}
                style={{ cursor: "pointer" }}
              >
                {showCode ? (
                  <span>{params.row.app_Login_Code}</span>
                ) : (
                  <span>********</span>
                )}
              </div>
              {/* {params.row.dob} */}
              <span style={{ marginLeft: "8px" }}>
                <PhoneIphoneSharp
                  titleAccess={
                    params.row.LoginStatus == "true"
                      ? "App login detected"
                      : "No App login detected"
                  }
                  style={{
                    color:
                      params.row.LoginStatus == "true" ? "#53bf9d" : "#f94c66",
                  }}
                />
              </span>
            </div>
          );
        },
      },
      {
        field: "dietPlan_Status",
        headerName: "",
        width: 50,
        renderCell: (params: any) => (
          <LanguageIcon
            titleAccess={
              params.row.dietPlan_Status ? "Published" : "Not Published"}
              style={{
                color: params.row.dietPlan_Status ? "#53bf9d" : "#f94c66",
              }}
            />
          ),
        },
        {
          field: "Action",
          headerName: "",
          width: 10,
          renderCell: (params: any) => (
            <div style={{ marginLeft: "-4px" }}>
              <DefaultButton
                style={{ background: "bottom", border: "none", cursor: "pointer" }}
                menuIconProps={{ iconName: "" }}
                menuProps={this.menuProps(params.row)}
              >
                <MoreVertIcon />
              </DefaultButton>
            </div>
          ),
        },
      ];
  
      return (
        <div style={{ width: "100%", maxWidth: "100%", marginLeft: "0" }}>
          <div>
            <div>
              {this.state.UploadModal && (
                <FluentProvider theme={teamsLightTheme}>
                  <ReportUploadModal
                    KidID={this.state.ActionSelectedKidId}
                    onCLOSE={this.UploadModalClose}
                  />
                </FluentProvider>
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                backgroundColor: "#53bf9d",
                height: "40px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "500",
                  marginLeft: "10px",
                  marginTop: "10px",
                }}
              >
                All registered patients list
              </p>
              <div
                style={{ marginRight: "20px", cursor: "pointer" }}
                onClick={this.BatchClicked}
              >
                <Badge badgeContent={this.state.UnreadFlips} color="primary">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    Flip
                    <MailIcon
                      color="action"
                      style={{ fontSize: 30, transform: "scaleX(-1)" }}
                    />
                  </div>
                </Badge>
              </div>
            </div>
            <div>
              <PrimaryButton
                style={{
                  backgroundColor: "#056db5",
                  border: "none",
                  marginBottom: "10px",
                  width: "max-content",
                }}
                onClick={this.openRegistrationForm}
              >
                <VscAdd /> New Registration
              </PrimaryButton>
  
              <StripedDataGrid
                style={{ fontSize: "15px" }}
                rows={this.state.allData}
                columns={columns}
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
                localeText={{
                  columnsPanelTextFieldLabel: "Search Column",
                  columnsPanelTextFieldPlaceholder: "Enter Column Title",
                  toolbarFiltersLabel: "Search Text",
                } as unknown as GridLocaleText}
                slots={{
                  toolbar: GridToolbar,
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                  },
                }}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                getRowClassName={(params: { indexRelativeToCurrentPage: number }) =>
                  params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
                }
              />
            </div>
          </div>
  
          <div>
            <NewRegistrationForm
              isOpen={this.state.isRegistrationFormOpen}
              ALLdata={this.state.allData}
              onDismiss={this.closeRegistrationForm}
              onSaveSuccess={async () => {
                this.closeRegistrationForm();
                await this.fetchData();
              }}
            />
          </div>
          <ReplyFlipModal
            ModalOpen={this.state.ModalOpen}
            KidDetail={this.state.KidDetailData}
            ModalClose={this.ModalCCloseCallback}
            Reply={false}
          />
        </div>
      );
    }
  }