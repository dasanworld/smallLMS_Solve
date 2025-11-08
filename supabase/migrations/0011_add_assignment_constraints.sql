-- Migration: Add assignment constraints and validation
-- Description: Add weight validation function and automatic closing trigger

-- Function to validate assignment weights within a course
CREATE OR REPLACE FUNCTION validate_assignment_weights(course_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_weight DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(points_weight), 0) INTO total_weight
    FROM assignments
    WHERE course_id = course_id_param
    AND deleted_at IS NULL;

    -- Return true if total weight is within limit (100%)
    RETURN total_weight <= 1.0;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically close past-deadline assignments
CREATE OR REPLACE FUNCTION close_past_deadline_assignments()
RETURNS void AS $$
BEGIN
    UPDATE assignments
    SET
        status = 'closed',
        closed_at = NOW()
    WHERE
        status = 'published'
        AND due_date < NOW()
        AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to validate assignment before insert/update
CREATE OR REPLACE FUNCTION validate_assignment_insert_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate weight constraints
    IF NOT validate_assignment_weights(NEW.course_id) THEN
        RAISE EXCEPTION 'ASSIGNMENT_WEIGHT_EXCEEDED: Total assignment weights in course cannot exceed 100%';
    END IF;

    -- For published assignments, ensure deadline is in the future
    IF NEW.status = 'published' AND NEW.due_date <= NOW() THEN
        RAISE EXCEPTION 'ASSIGNMENT_PAST_DEADLINE: Published assignment deadline must be in the future';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assignment validation
CREATE TRIGGER assignment_validation_trigger
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_assignment_insert_update();

-- Create index for efficient automatic closing
CREATE INDEX idx_assignments_publishable
ON assignments(course_id, status, due_date)
WHERE status = 'published' AND deleted_at IS NULL;

-- Create index for efficient weight validation
CREATE INDEX idx_assignments_course_weight
ON assignments(course_id, points_weight)
WHERE deleted_at IS NULL;