-- CMMS Database Schema for MySQL
-- Generated from SQLAlchemy models
-- MySQL 5.7+ / MariaDB 10.2+ compatible

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT=0;
START TRANSACTION;
SET time_zone='+00:00';

-- Table: roles

CREATE TABLE roles (
	id INT NOT NULL AUTO_INCREMENT, 
	name VARCHAR(50) NOT NULL, 
	permissions JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);



-- Table: users

CREATE TABLE users (
	id INT NOT NULL AUTO_INCREMENT, 
	username VARCHAR(50) NOT NULL, 
	full_name VARCHAR(100), 
	email VARCHAR(120), 
	phone VARCHAR(20), 
	profile_picture TEXT, 
	password_hash VARCHAR(255) NOT NULL, 
	role_id INT NOT NULL, 
	is_active TINYINT(1), 
	language_preference VARCHAR(10), 
	must_change_password TINYINT(1), 
	anonymized_at DATETIME, 
	anonymized_by_user_id INT, 
	vacation_days_per_year INT, 
	vacation_days_used INT, 
	shift_type VARCHAR(50), 
	shift_start_time VARCHAR(10), 
	shift_end_time VARCHAR(10), 
	work_days_per_week INT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (email), 
	FOREIGN KEY(role_id) REFERENCES roles (id), 
	FOREIGN KEY(anonymized_by_user_id) REFERENCES users (id)
);



-- Table: user_sessions

CREATE TABLE user_sessions (
	id INT NOT NULL AUTO_INCREMENT, 
	user_id INT NOT NULL, 
	token_hash VARCHAR(255) NOT NULL, 
	created_at DATETIME, 
	expires_at DATETIME NOT NULL, 
	last_activity_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	UNIQUE (token_hash)
)



-- Table: audit_logs

CREATE TABLE audit_logs (
	id INT NOT NULL AUTO_INCREMENT, 
	user_id INT, 
	action_type VARCHAR(50) NOT NULL, 
	entity_type VARCHAR(50) NOT NULL, 
	entity_id INT, 
	changes JSON, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)



-- Table: production_lines

CREATE TABLE production_lines (
	id INT NOT NULL AUTO_INCREMENT, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	location VARCHAR(200), 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_production_line_name UNIQUE (name)
)



-- Table: machines

CREATE TABLE machines (
	id INT NOT NULL AUTO_INCREMENT, 
	production_line_id INT NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	serial_number VARCHAR(100), 
	model VARCHAR(100), 
	manufacturer VARCHAR(100), 
	manual_pdf_path VARCHAR(500), 
	install_date DATETIME, 
	status VARCHAR(50), 
	maintenance_interval VARCHAR(100), 
	asset_tag VARCHAR(50), 
	purchase_date DATETIME, 
	purchase_price FLOAT, 
	warranty_expiry_date DATETIME, 
	supplier VARCHAR(200), 
	operating_hours FLOAT, 
	last_service_date DATETIME, 
	next_service_date DATETIME, 
	criticality_level VARCHAR(50), 
	energy_consumption VARCHAR(100), 
	power_requirements VARCHAR(200), 
	operating_temperature_range VARCHAR(100), 
	weight FLOAT, 
	dimensions VARCHAR(200), 
	notes TEXT, 
	version INT, 
	created_by_user_id INT, 
	updated_by_user_id INT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(production_line_id) REFERENCES production_lines (id), 
	UNIQUE (serial_number), 
	UNIQUE (asset_tag), 
	FOREIGN KEY(created_by_user_id) REFERENCES users (id), 
	FOREIGN KEY(updated_by_user_id) REFERENCES users (id)
)



-- Table: modules

CREATE TABLE modules (
	id INT NOT NULL AUTO_INCREMENT, 
	machine_id INT NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	specifications JSON, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id)
)



-- Table: machine_versions

CREATE TABLE machine_versions (
	id INT NOT NULL AUTO_INCREMENT, 
	machine_id INT NOT NULL, 
	version INT NOT NULL, 
	changed_fields JSON, 
	changed_by_user_id INT NOT NULL, 
	change_description TEXT, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id), 
	FOREIGN KEY(changed_by_user_id) REFERENCES users (id)
)



-- Table: asset_history

CREATE TABLE asset_history (
	id INT NOT NULL AUTO_INCREMENT, 
	machine_id INT, 
	action_type VARCHAR(50) NOT NULL, 
	description TEXT, 
	user_id INT, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)



-- Table: suppliers

CREATE TABLE suppliers (
	id INT NOT NULL AUTO_INCREMENT, 
	name VARCHAR(150) NOT NULL, 
	contact_person VARCHAR(100), 
	email VARCHAR(120), 
	phone VARCHAR(20), 
	address VARCHAR(200), 
	city VARCHAR(100), 
	postal_code VARCHAR(20), 
	country VARCHAR(100), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (name)
)



-- Table: parts

CREATE TABLE parts (
	id INT NOT NULL AUTO_INCREMENT, 
	sku VARCHAR(50) NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	description TEXT, 
	category VARCHAR(100), 
	unit VARCHAR(20), 
	buy_price FLOAT, 
	sell_price FLOAT, 
	safety_stock INT, 
	reorder_quantity INT, 
	supplier_id INT, 
	last_count_date DATETIME, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(supplier_id) REFERENCES suppliers (id)
)



-- Table: inventory_levels

CREATE TABLE inventory_levels (
	id INT NOT NULL AUTO_INCREMENT, 
	part_id INT NOT NULL, 
	quantity_on_hand INT, 
	quantity_reserved INT, 
	bin_location VARCHAR(100), 
	last_updated DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (part_id), 
	FOREIGN KEY(part_id) REFERENCES parts (id)
)



-- Table: stock_transactions

CREATE TABLE stock_transactions (
	id INT NOT NULL AUTO_INCREMENT, 
	part_id INT NOT NULL, 
	transaction_type VARCHAR(50) NOT NULL, 
	quantity INT NOT NULL, 
	reference_id INT, 
	reference_type VARCHAR(50), 
	user_id INT, 
	notes TEXT, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(part_id) REFERENCES parts (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)



-- Table: qr_codes

CREATE TABLE qr_codes (
	id INT NOT NULL AUTO_INCREMENT, 
	part_id INT NOT NULL, 
	qr_data VARCHAR(500) NOT NULL, 
	generated_at DATETIME, 
	is_printed TINYINT(1), 
	PRIMARY KEY (id), 
	FOREIGN KEY(part_id) REFERENCES parts (id)
)



-- Table: worksheets

CREATE TABLE worksheets (
	id INT NOT NULL AUTO_INCREMENT, 
	machine_id INT NOT NULL, 
	assigned_to_user_id INT NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	description TEXT, 
	status VARCHAR(50) NOT NULL, 
	breakdown_time DATETIME, 
	repair_finished_time DATETIME, 
	total_downtime_hours FLOAT, 
	fault_cause TEXT, 
	created_at DATETIME, 
	closed_at DATETIME, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id), 
	FOREIGN KEY(assigned_to_user_id) REFERENCES users (id)
)



-- Table: worksheet_parts

CREATE TABLE worksheet_parts (
	id INT NOT NULL AUTO_INCREMENT, 
	worksheet_id INT NOT NULL, 
	part_id INT NOT NULL, 
	quantity_used INT NOT NULL, 
	unit_cost_at_time FLOAT, 
	notes TEXT, 
	added_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(worksheet_id) REFERENCES worksheets (id), 
	FOREIGN KEY(part_id) REFERENCES parts (id)
)



-- Table: worksheet_photos

CREATE TABLE worksheet_photos (
	id INT NOT NULL AUTO_INCREMENT, 
	worksheet_id INT NOT NULL, 
	photo_path VARCHAR(500) NOT NULL, 
	original_filename VARCHAR(255), 
	description TEXT, 
	uploaded_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(worksheet_id) REFERENCES worksheets (id)
)



-- Table: worksheet_pdfs

CREATE TABLE worksheet_pdfs (
	id INT NOT NULL AUTO_INCREMENT, 
	worksheet_id INT NOT NULL, 
	pdf_path VARCHAR(500) NOT NULL, 
	generated_at DATETIME, 
	page_count INT, 
	PRIMARY KEY (id), 
	UNIQUE (worksheet_id), 
	FOREIGN KEY(worksheet_id) REFERENCES worksheets (id)
)



-- Table: pm_tasks

CREATE TABLE pm_tasks (
	id INT NOT NULL AUTO_INCREMENT, 
	machine_id INT, 
	task_name VARCHAR(150) NOT NULL, 
	task_description TEXT, 
	task_type VARCHAR(20), 
	frequency_days INT, 
	last_executed_date DATETIME, 
	next_due_date DATETIME, 
	is_active TINYINT(1), 
	created_at DATETIME, 
	updated_at DATETIME, 
	assigned_to_user_id INT, 
	priority VARCHAR(20), 
	status VARCHAR(50), 
	due_date DATETIME, 
	estimated_duration_minutes INT, 
	created_by_user_id INT, 
	location VARCHAR(200), 
	PRIMARY KEY (id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id), 
	FOREIGN KEY(assigned_to_user_id) REFERENCES users (id), 
	FOREIGN KEY(created_by_user_id) REFERENCES users (id)
)



-- Table: pm_histories

CREATE TABLE pm_histories (
	id INT NOT NULL AUTO_INCREMENT, 
	pm_task_id INT NOT NULL, 
	executed_date DATETIME, 
	assigned_to_user_id INT, 
	completed_by_user_id INT, 
	completion_status VARCHAR(50), 
	notes TEXT, 
	duration_minutes INT, 
	worksheet_id INT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(pm_task_id) REFERENCES pm_tasks (id), 
	FOREIGN KEY(assigned_to_user_id) REFERENCES users (id), 
	FOREIGN KEY(completed_by_user_id) REFERENCES users (id), 
	FOREIGN KEY(worksheet_id) REFERENCES worksheets (id)
)



-- Table: work_request_pdfs

CREATE TABLE work_request_pdfs (
	id INT NOT NULL AUTO_INCREMENT, 
	pm_task_id INT NOT NULL, 
	pdf_path VARCHAR(500) NOT NULL, 
	generated_at DATETIME, 
	generated_by_user_id INT, 
	page_count INT, 
	PRIMARY KEY (id), 
	UNIQUE (pm_task_id), 
	FOREIGN KEY(pm_task_id) REFERENCES pm_tasks (id), 
	FOREIGN KEY(generated_by_user_id) REFERENCES users (id)
)



-- Table: pm_worksheet_pdfs

CREATE TABLE pm_worksheet_pdfs (
	id INT NOT NULL AUTO_INCREMENT, 
	pm_history_id INT NOT NULL, 
	pdf_path VARCHAR(500) NOT NULL, 
	generated_at DATETIME, 
	generated_by_user_id INT, 
	page_count INT, 
	PRIMARY KEY (id), 
	UNIQUE (pm_history_id), 
	FOREIGN KEY(pm_history_id) REFERENCES pm_histories (id), 
	FOREIGN KEY(generated_by_user_id) REFERENCES users (id)
)



-- Table: scrapping_documents

CREATE TABLE scrapping_documents (
	id INT NOT NULL AUTO_INCREMENT, 
	entity_type VARCHAR(50) NOT NULL, 
	entity_id INT NOT NULL, 
	docx_path VARCHAR(500) NOT NULL, 
	generated_at DATETIME, 
	generated_by_user_id INT, 
	reason TEXT, 
	worksheet_id INT, 
	pm_history_id INT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(generated_by_user_id) REFERENCES users (id), 
	FOREIGN KEY(worksheet_id) REFERENCES worksheets (id), 
	FOREIGN KEY(pm_history_id) REFERENCES pm_histories (id)
)



-- Table: system_logs

CREATE TABLE system_logs (
	id INT NOT NULL AUTO_INCREMENT, 
	log_category VARCHAR(50) NOT NULL, 
	action_type VARCHAR(50) NOT NULL, 
	entity_type VARCHAR(50) NOT NULL, 
	entity_id INT, 
	user_id INT, 
	description TEXT, 
	log_metadata JSON, 
	timestamp DATETIME, 
	year INT, 
	month INT, 
	week INT, 
	day INT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)



-- Table: app_settings

CREATE TABLE app_settings (
	id INT NOT NULL AUTO_INCREMENT, 
	`key` VARCHAR(100) NOT NULL, 
	value TEXT NOT NULL, 
	description VARCHAR(500), 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (`key`)
)



-- Table: vacation_requests

CREATE TABLE vacation_requests (
	id INT NOT NULL AUTO_INCREMENT, 
	user_id INT NOT NULL, 
	start_date DATETIME NOT NULL, 
	end_date DATETIME NOT NULL, 
	vacation_type VARCHAR(50), 
	reason TEXT, 
	status VARCHAR(50), 
	requested_at DATETIME, 
	approved_by_user_id INT, 
	approved_at DATETIME, 
	rejection_reason TEXT, 
	days_count INT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(approved_by_user_id) REFERENCES users (id)
)



-- Table: shift_schedules

CREATE TABLE shift_schedules (
	id INT NOT NULL AUTO_INCREMENT, 
	user_id INT NOT NULL, 
	shift_type VARCHAR(50) NOT NULL, 
	start_time VARCHAR(10), 
	end_time VARCHAR(10), 
	effective_from DATETIME NOT NULL, 
	effective_to DATETIME, 
	rotation_start_date DATE, 
	initial_shift VARCHAR(10), 
	rotation_pattern VARCHAR(20), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)



-- Table: shift_overrides

CREATE TABLE shift_overrides (
	id INT NOT NULL AUTO_INCREMENT, 
	user_id INT NOT NULL, 
	override_date DATE NOT NULL, 
	shift_type VARCHAR(10) NOT NULL, 
	start_time VARCHAR(10), 
	end_time VARCHAR(10), 
	created_by_user_id INT NOT NULL, 
	created_at DATETIME, 
	notes TEXT, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_user_date_override UNIQUE (user_id, override_date), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(created_by_user_id) REFERENCES users (id)
)



-- Table: vacation_documents

CREATE TABLE vacation_documents (
	id INT NOT NULL AUTO_INCREMENT, 
	vacation_request_id INT NOT NULL, 
	docx_path VARCHAR(500) NOT NULL, 
	generated_at DATETIME, 
	generated_by_user_id INT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(vacation_request_id) REFERENCES vacation_requests (id), 
	FOREIGN KEY(generated_by_user_id) REFERENCES users (id)
)



-- Table: notifications

CREATE TABLE notifications (
	id INT NOT NULL AUTO_INCREMENT, 
	user_id INT NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	message TEXT NOT NULL, 
	notification_type VARCHAR(50), 
	is_read TINYINT(1), 
	related_entity_type VARCHAR(50), 
	related_entity_id INT, 
	created_at DATETIME, 
	read_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)



-- Table: service_records

CREATE TABLE service_records (
	id INT NOT NULL AUTO_INCREMENT, 
	machine_id INT NOT NULL, 
	service_date DATETIME NOT NULL, 
	service_type VARCHAR(100), 
	performed_by VARCHAR(200), 
	technician_name VARCHAR(200), 
	service_cost FLOAT, 
	service_duration_hours FLOAT, 
	description TEXT, 
	notes TEXT, 
	next_service_date DATETIME, 
	parts_replaced TEXT, 
	created_by_user_id INT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id), 
	FOREIGN KEY(created_by_user_id) REFERENCES users (id)
)



-- Table: machine_parts

CREATE TABLE machine_parts (
	machine_id INT NOT NULL, 
	part_id INT NOT NULL, 
	PRIMARY KEY (machine_id, part_id), 
	FOREIGN KEY(machine_id) REFERENCES machines (id), 
	FOREIGN KEY(part_id) REFERENCES parts (id)
)



-- Indexes

CREATE UNIQUE INDEX ix_users_username ON users (username)
CREATE INDEX idx_username ON users (username)
CREATE INDEX ix_audit_logs_timestamp ON audit_logs (timestamp)
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp)
CREATE INDEX idx_asset_tag ON machines (asset_tag)
CREATE INDEX idx_serial_number ON machines (serial_number)
CREATE INDEX idx_production_line_id ON machines (production_line_id)
CREATE INDEX idx_modules_machine_id ON modules (machine_id)
CREATE INDEX idx_machine_versions_timestamp ON machine_versions (timestamp)
CREATE INDEX ix_machine_versions_timestamp ON machine_versions (timestamp)
CREATE INDEX idx_machine_versions_machine_id ON machine_versions (machine_id)
CREATE INDEX idx_machine_versions_version ON machine_versions (version)
CREATE INDEX idx_asset_history_machine_id ON asset_history (machine_id)
CREATE INDEX idx_asset_history_timestamp ON asset_history (timestamp)
CREATE INDEX ix_asset_history_timestamp ON asset_history (timestamp)
CREATE UNIQUE INDEX ix_parts_sku ON parts (sku)
CREATE INDEX idx_sku ON parts (sku)
CREATE INDEX idx_stock_transactions_part_id ON stock_transactions (part_id)
CREATE INDEX ix_stock_transactions_timestamp ON stock_transactions (timestamp)
CREATE INDEX idx_stock_transactions_reference ON stock_transactions (reference_id, reference_type)
CREATE INDEX idx_stock_transactions_timestamp ON stock_transactions (timestamp)
CREATE INDEX idx_status ON worksheets (status)
CREATE INDEX idx_machine_id ON worksheets (machine_id)
CREATE INDEX idx_created_at ON worksheets (created_at)
CREATE INDEX ix_worksheets_created_at ON worksheets (created_at)
CREATE INDEX idx_part_id ON worksheet_parts (part_id)
CREATE INDEX idx_worksheet_id ON worksheet_parts (worksheet_id)
CREATE INDEX idx_pm_tasks_next_due_date ON pm_tasks (next_due_date)
CREATE INDEX idx_pm_tasks_assigned_to_user_id ON pm_tasks (assigned_to_user_id)
CREATE INDEX idx_pm_tasks_status ON pm_tasks (status)
CREATE INDEX ix_pm_tasks_next_due_date ON pm_tasks (next_due_date)
CREATE INDEX idx_pm_tasks_machine_id ON pm_tasks (machine_id)
CREATE INDEX idx_pm_histories_executed_date ON pm_histories (executed_date)
CREATE INDEX idx_pm_histories_pm_task_id ON pm_histories (pm_task_id)
CREATE INDEX idx_scrapping_timestamp ON scrapping_documents (generated_at)
CREATE INDEX idx_scrapping_entity ON scrapping_documents (entity_type, entity_id)
CREATE INDEX idx_system_logs_entity ON system_logs (entity_type, entity_id)
CREATE INDEX ix_system_logs_month ON system_logs (month)
CREATE INDEX ix_system_logs_log_category ON system_logs (log_category)
CREATE INDEX ix_system_logs_week ON system_logs (week)
CREATE INDEX idx_system_logs_timestamp ON system_logs (timestamp)
CREATE INDEX ix_system_logs_timestamp ON system_logs (timestamp)
CREATE INDEX ix_system_logs_day ON system_logs (day)
CREATE INDEX idx_system_logs_category ON system_logs (log_category)
CREATE INDEX ix_system_logs_year ON system_logs (year)
CREATE INDEX idx_system_logs_date ON system_logs (year, month, week, day)
CREATE INDEX idx_vacation_requests_user_id ON vacation_requests (user_id)
CREATE INDEX idx_vacation_requests_dates ON vacation_requests (start_date, end_date)
CREATE INDEX idx_vacation_requests_requested_at ON vacation_requests (requested_at)
CREATE INDEX idx_vacation_requests_status ON vacation_requests (status)
CREATE INDEX idx_shift_schedules_effective ON shift_schedules (effective_from, effective_to)
CREATE INDEX idx_shift_schedules_user_id ON shift_schedules (user_id)
CREATE INDEX idx_shift_overrides_user_date ON shift_overrides (user_id, override_date)
CREATE INDEX idx_vacation_documents_request_id ON vacation_documents (vacation_request_id)
CREATE INDEX idx_vacation_documents_generated_at ON vacation_documents (generated_at)
CREATE INDEX idx_notifications_created_at ON notifications (created_at)
CREATE INDEX ix_notifications_created_at ON notifications (created_at)
CREATE INDEX idx_notifications_user_id ON notifications (user_id)
CREATE INDEX idx_notifications_is_read ON notifications (is_read)
CREATE INDEX idx_service_records_next_service_date ON service_records (next_service_date)
CREATE INDEX idx_service_records_service_date ON service_records (service_date)
CREATE INDEX idx_service_records_machine_id ON service_records (machine_id)

SET FOREIGN_KEY_CHECKS=1;
COMMIT;