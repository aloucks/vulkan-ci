use ash::{vk, Entry};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let devices = get_physical_devices()?;
    println!("{:#?}", devices);
    Ok(())
}

fn get_physical_devices(
) -> Result<Vec<(String, vk::PhysicalDeviceType, Version)>, Box<dyn std::error::Error>> {
    // Initializes the vulkan loader library
    let entry = unsafe { Entry::new()? };

    // Request the validation layer with the instance creation parameters
    let layer_name =
        concat!("VK_LAYER_KHRONOS_validation", "\0").as_ptr() as *const std::os::raw::c_char;
    let layer_names = vec![layer_name];
    let app_info = vk::ApplicationInfo {
        api_version: vk::make_api_version(1, 0, 0, 0),
        ..Default::default()
    };
    let create_info = vk::InstanceCreateInfo::builder()
        .application_info(&app_info)
        .enabled_layer_names(&layer_names);

    // Create an instance and query the available physical devices
    let physical_devices = unsafe {
        let instance = entry.create_instance(&create_info, None)?;
        instance
            .enumerate_physical_devices()?
            .iter()
            .cloned()
            .map(|physical_device| {
                let properties = instance.get_physical_device_properties(physical_device);
                let name = std::ffi::CStr::from_ptr(properties.device_name.as_ptr() as *const _)
                    .to_string_lossy()
                    .to_string();
                let version = Version {
                    major: vk::api_version_major(properties.api_version),
                    minor: vk::api_version_minor(properties.api_version),
                    patch: vk::api_version_patch(properties.api_version),
                };
                (name, properties.device_type, version)
            })
            .collect()
    };
    Ok(physical_devices)
}

#[derive(Debug, Copy, Clone)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

#[test]
fn test_get_physical_devices() -> Result<(), Box<dyn std::error::Error>> {
    let devices = get_physical_devices()?;
    assert_eq!(false, devices.is_empty());
    println!("{:#?}", devices);
    Ok(())
}
