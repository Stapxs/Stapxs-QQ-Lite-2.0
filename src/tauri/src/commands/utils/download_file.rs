use std::io::{self, Write};
use std::path::{Path, PathBuf};

use tempfile::NamedTempFile;

// Keep the destination untouched until the entire download has succeeded.
pub struct DownloadFile {
    temporary: NamedTempFile,
    destination: PathBuf,
}

impl DownloadFile {
    pub fn new(destination: &Path) -> io::Result<Self> {
        let parent = destination.parent().ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "Download destination has no parent",
            )
        })?;
        let temporary = tempfile::Builder::new()
            .prefix(".ssqq-download-")
            .tempfile_in(parent)?;
        Ok(Self {
            temporary,
            destination: destination.to_path_buf(),
        })
    }

    pub fn write_all(&mut self, bytes: &[u8]) -> io::Result<()> {
        self.temporary.write_all(bytes)
    }

    pub fn finish(self) -> io::Result<()> {
        self.temporary.as_file().sync_all()?;
        // Persist replaces the destination without first deleting it, including on Windows.
        self.temporary
            .persist(&self.destination)
            .map_err(|error| error.error)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::DownloadFile;
    use std::fs;

    #[test]
    fn unfinished_download_preserves_existing_file() {
        let directory = tempfile::tempdir().unwrap();
        let destination = directory.path().join("download.bin");
        fs::write(&destination, b"original").unwrap();

        {
            let mut download = DownloadFile::new(&destination).unwrap();
            download.write_all(b"partial").unwrap();
            assert_eq!(fs::read(&destination).unwrap(), b"original");
            // Errors and cancellation drop the unfinished download.
        }

        assert_eq!(fs::read(&destination).unwrap(), b"original");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
    }

    #[test]
    fn unfinished_download_leaves_no_new_destination() {
        let directory = tempfile::tempdir().unwrap();
        let destination = directory.path().join("download.bin");
        let mut download = DownloadFile::new(&destination).unwrap();
        download.write_all(b"partial").unwrap();
        drop(download);

        assert!(!destination.exists());
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 0);
    }

    #[test]
    fn completed_download_replaces_existing_file() {
        let directory = tempfile::tempdir().unwrap();
        let destination = directory.path().join("download.bin");
        fs::write(&destination, b"original").unwrap();
        let mut download = DownloadFile::new(&destination).unwrap();
        download.write_all(b"complete").unwrap();
        assert_eq!(fs::read(&destination).unwrap(), b"original");
        download.finish().unwrap();

        assert_eq!(fs::read(&destination).unwrap(), b"complete");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
    }

    #[test]
    fn completed_download_creates_new_destination() {
        let directory = tempfile::tempdir().unwrap();
        let destination = directory.path().join("download.bin");
        let mut download = DownloadFile::new(&destination).unwrap();
        download.write_all(b"complete").unwrap();
        assert!(!destination.exists());
        download.finish().unwrap();

        assert_eq!(fs::read(&destination).unwrap(), b"complete");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
    }

    #[test]
    fn failed_replacement_preserves_destination_and_cleans_temporary_file() {
        let directory = tempfile::tempdir().unwrap();
        let destination = directory.path().join("download.bin");
        fs::create_dir(&destination).unwrap();
        let original = destination.join("original.bin");
        fs::write(&original, b"original").unwrap();
        let mut download = DownloadFile::new(&destination).unwrap();
        download.write_all(b"complete").unwrap();

        assert!(download.finish().is_err());
        assert_eq!(fs::read(&original).unwrap(), b"original");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
    }
}
