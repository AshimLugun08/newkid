// types.ts
export interface ReportUploadModalProps {
  KidID: string;
  AppointmentID?: string;
  onCLOSE: () => void;
}

export interface ReportUploadModalState {
  open: boolean;
  selectedDocumentType: string;
  selectedFile: File | string | null;
  selectedFilename: string;
  Loader: boolean;
  userTitle: string;
}

// styles.ts
export const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 540,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 2,
};

// constants.ts
export const DOC_TYPE_OPTIONS = [
  { key: "Prescription", text: "Prescription" },
  { key: "Pathology", text: "Pathology" },
  { key: "Radiology", text: "Radiology" },
];

// ReportUploadModal.tsx
import * as React from "react";
import {
  DefaultButton,
  Dropdown,
  PrimaryButton,
  Spinner,
} from "office-ui-fabric-react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { baseAPI } from "./EnvironmentVariables";
import { Box, Modal } from "@mui/material";
// import { ReportUploadModalProps, ReportUploadModalState } from "./types";
// import { modalStyle } from "./styles";
// import { DOC_TYPE_OPTIONS } from "./constants";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export class ReportUploadModal extends React.Component<
  ReportUploadModalProps,
  ReportUploadModalState
> {
  private triggerRef: React.RefObject<HTMLButtonElement>;
  dialogRef: React.RefObject<unknown>;
  // private dialogRef: React.RefObject<HTMLDivElement>;

  constructor(props: ReportUploadModalProps) {
    super(props);
    this.state = {
      open: true,
      selectedDocumentType: "",
      selectedFile: null,
      selectedFilename: "",
      Loader: false,
      userTitle: "",
    };

    this.triggerRef = React.createRef();
    this.dialogRef = React.createRef();
  }

  componentDidMount() {
    this.GetUserName();
  }

  private sanitizeFilename = (filename: string): string => {
    return filename
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");
  };

  private logUploadFailure = (
    userTitle: string | null,
    fileName: string,
    fileType: string,
    error?: any
  ): void => {
    const userInfo = userTitle || "Unknown User";
    console.log(
      `Logging upload failure - User: ${userInfo}, File name: ${fileName}, File type: ${fileType}, Error:`,
      error || "N/A"
    );
  };

  private onClickClose = (): void => {
    this.setState({ open: false });
    if (this.triggerRef.current) {
      this.triggerRef.current.focus();
    }
    this.props.onCLOSE();
  };

  private DocTypeChoose = (event: any, data: any): void => {
    const selectedItemValue = data.text;
    this.setState({ selectedDocumentType: selectedItemValue });
    console.log(selectedItemValue);
  };

  private imageUpdated = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (!file) {
      window.alert("No file selected!");
      return;
    }

    const fileType = file.type;
    const fileName = this.sanitizeFilename(file.name);

    try {
      if (fileType.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        this.setState({
          selectedFile: imageUrl,
          selectedFilename: fileName,
        });
        console.log("Selected image file name: " + fileName);
      } else if (fileType === "application/pdf") {
        this.setState({
          selectedFile: file,
          selectedFilename: fileName,
        });
        console.log("Selected PDF file name: " + fileName);
      } else {
        console.error(
          "Unsupported file type:",
          fileType,
          "File name:",
          fileName
        );
        window.alert(
          "Invalid file type. Please upload only PDF and Image formats for medical records."
        );
        this.logUploadFailure(
          this.state.userTitle,
          fileName,
          fileType,
          "Unsupported file type"
        );
        this.setState({
          selectedFilename: "",
          selectedFile: null,
        });
        return;
      }
    } catch (error) {
      console.error("File upload failed due to a system error:", error);
      window.alert(
        "An error occurred while uploading the file. Please try again later."
      );
      this.logUploadFailure(this.state.userTitle, fileName, fileType, error);
    }
  };

  private GetUserName = async (): Promise<void> => {
    try {
      const response = await axios.get("/_api/web/currentuser");
      const userTitle = response.data.Email;
      this.setState({ userTitle });
    } catch (error) {
      console.error("Error fetching user name:", error);
      this.setState({ userTitle: "Unknown User" });
    }
  };

  private UploadDoc_API = async (): Promise<void> => {
    const { selectedDocumentType, selectedFile, selectedFilename, userTitle } = this.state;

    if (!selectedDocumentType || !selectedFile) {
      if (!selectedFile) {
        alert("Please choose a file to upload!");
      } else {
        alert("Please select a document type!");
      }
      return;
    }

    this.setState({ Loader: true });

    try {
      const url = `${baseAPI()}/addmedicalrecords`;
      const formData = new FormData();
      formData.append("Kid_Id", this.props.KidID);
      formData.append("Type", selectedDocumentType);
      formData.append("Appointment_Related", this.props.AppointmentID ? "true" : "false");
      formData.append("Appointment_Id", this.props.AppointmentID || "0");
      formData.append("upload_by", userTitle);

      if (typeof selectedFile === "string" && selectedFile.startsWith("blob:")) {
        const imageBlob = await fetch(selectedFile).then((response) =>
          response.blob()
        );
        formData.append("Document", imageBlob, selectedFilename);
      } else if (selectedFile instanceof File) {
        formData.append("Document", selectedFile, selectedFilename);
      } else {
        throw new Error("Unsupported file type");
      }

      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "text/plain",
        },
      });

      console.log("API response:", response.data);
      window.alert(`${selectedDocumentType} report uploaded successfully!`);
      this.setState({ Loader: false });
      this.onClickClose();
    } catch (error: any) {
      this.setState({ Loader: false });
      this.onClickClose();
      console.error("Upload error:", error);
      window.alert(
        "Error in Upload: " + error.message || "Please try again later."
      );
    }
  };

  render() {
    const { open, selectedFilename, selectedDocumentType, Loader } = this.state;

    return (
      <div>
        <Modal
          open={open}
          onClose={this.onClickClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={modalStyle}>
            <div
              style={{
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h5 style={{ color: "#03787c" }}>Upload Past Medical Documents</h5>
              <div
                style={{
                  width: "390px",
                  border: "1px solid black",
                  borderStyle: "dashed",
                  padding: "16px",
                }}
              >
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload file
                  <VisuallyHiddenInput onChange={this.imageUpdated} type="file" />
                </Button>
                <p
                  className="text-center"
                  style={{
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    margin: "10px 0",
                  }}
                >
                  Selected File: {selectedFilename}
                </p>
              </div>
              <div style={{ display: "flex", margin: "10px", padding: "5px" }}>
                <div>
                  <Dropdown
                    style={{ width: "200px" }}
                    placeholder="Select Document Type"
                    options={DOC_TYPE_OPTIONS}
                    onChange={this.DocTypeChoose}
                    selectedKey={selectedDocumentType}
                  />
                </div>
                <div style={{ marginLeft: "15px", display: "flex" }}>
                  <div>
                    <DefaultButton onClick={this.onClickClose}>
                      Close
                    </DefaultButton>
                  </div>
                  {!Loader ? (
                    <div style={{ marginLeft: "15px" }}>
                      <PrimaryButton onClick={this.UploadDoc_API}>
                        Save
                      </PrimaryButton>
                    </div>
                  ) : (
                    <div style={{ marginTop: "5px", marginLeft: "15px" }}>
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
      </div>
    );
  }
}
