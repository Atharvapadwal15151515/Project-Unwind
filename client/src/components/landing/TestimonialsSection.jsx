import {
  MessageCircleMore,
  Quote,
  Star,
  Send,
  UserRound,
  EyeOff,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  getPublicTestimonials,
  submitTestimonial,
} from "../../services/testimonialService.js";

import "../../pages/Landing/LandingPage.css";


function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [displayMode, setDisplayMode] = useState("name");

  const [formData, setFormData] = useState({
    display_name: "",
    testimonial_text: "",
    rating: 5,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");


  const fetchTestimonials = async () => {
    try {
      const result = await getPublicTestimonials();

      if (
        result.success &&
        Array.isArray(result.data)
      ) {
        setTestimonials(result.data);
      }
    } catch (error) {
      console.error(
        "Failed to fetch testimonials:",
        error
      );
    }
  };


  useEffect(() => {
    fetchTestimonials();
  }, []);


  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(
        (previous) =>
          (previous + 1) %
          testimonials.length
      );
    }, 7000);

    return () => clearInterval(interval);
  }, [testimonials.length]);


  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitError("");
    setSubmitMessage("");
  };


  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
    setSubmitError("");
    setSubmitMessage("");
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitError("");
    setSubmitMessage("");
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError("");
    setSubmitMessage("");

    const testimonialText =
      formData.testimonial_text.trim();

    const displayName =
      formData.display_name.trim();


    if (testimonialText.length < 10) {
      setSubmitError(
        "Please write at least 10 characters."
      );
      return;
    }


    if (
      displayMode === "name" &&
      displayName.length < 2
    ) {
      setSubmitError(
        "Please enter your name."
      );
      return;
    }


    try {
      setIsSubmitting(true);

      await submitTestimonial({
        display_name:
          displayMode === "anonymous"
            ? null
            : displayName,

        testimonial_text: testimonialText,

        is_anonymous:
          displayMode === "anonymous",

        rating: Number(formData.rating),
      });


      setSubmitMessage(
        "Thank you. Your testimonial has been shared."
      );


      setFormData({
        display_name: "",
        testimonial_text: "",
        rating: 5,
      });

      setDisplayMode("name");


      await fetchTestimonials();


      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitMessage("");
      }, 1200);

    } catch (error) {
      setSubmitError(
        error.message ||
        "Unable to submit testimonial."
      );

    } finally {
      setIsSubmitting(false);
    }
  };


  const currentTestimonial =
    testimonials.length > 0
      ? testimonials[currentIndex]
      : null;


  return (
    <section
      id="stories"
      className="landing-testimonials-placeholder"
    >

      <div className="landing-section-heading">
        <span className="landing-section-badge">
          Testimonials
        </span>

        <h2>
          Real experiences.
          <br />
          Shared in their own words.
        </h2>

        <p>
          Read experiences shared by the
          UNWIND community or share your own.
        </p>
      </div>


      {/* CTA BUTTON */}

      <div className="testimonial-share-cta">

        <button
          type="button"
          className="testimonial-open-button"
          onClick={() =>
            setIsModalOpen(true)
          }
        >
          <MessageCircleMore size={19} />

          Share your experience
        </button>

        <span>
          Share with your name or anonymously.
        </span>

      </div>


      {/* TESTIMONIAL DISPLAY */}

      <div className="testimonials-display-area">

        <div className="testimonials-display-heading">

          <span className="testimonials-placeholder-eyebrow">
            Community voices
          </span>

          <h3>
            Shared by our community
          </h3>

        </div>


        {currentTestimonial ? (

          <div
            className="testimonial-live-card"
            key={
              currentTestimonial.testimonial_id
            }
          >

            <div className="testimonial-quote-icon">
              <Quote size={28} />
            </div>

            <blockquote>
              “
              {
                currentTestimonial.testimonial_text
              }
              ”
            </blockquote>


            {currentTestimonial.rating && (
              <div className="testimonial-live-rating">

                {Array.from(
                  {
                    length:
                      currentTestimonial.rating,
                  },
                  (_, index) => (
                    <Star
                      key={index}
                      size={17}
                      fill="currentColor"
                    />
                  )
                )}

              </div>
            )}


            <div className="testimonial-live-author">

              <span className="testimonial-author-name">
                {
                  currentTestimonial.display_name
                }
              </span>

              <span className="testimonial-author-label">
                UNWIND Community
              </span>

            </div>


            {testimonials.length > 1 && (
              <div className="testimonial-indicators">

                {testimonials.map(
                  (testimonial, index) => (
                    <button
                      key={
                        testimonial.testimonial_id
                      }
                      type="button"
                      className={
                        index === currentIndex
                          ? "testimonial-indicator active"
                          : "testimonial-indicator"
                      }
                      onClick={() =>
                        setCurrentIndex(index)
                      }
                    />
                  )
                )}

              </div>
            )}

          </div>

        ) : (

          <div className="testimonials-placeholder-card">

            <div className="testimonials-placeholder-icon">
              <MessageCircleMore size={28} />
            </div>

            <span className="testimonials-placeholder-eyebrow">
              Community voices
            </span>

            <h3>
              Be the first to share
            </h3>

            <p>
              Community testimonials will
              appear here once someone shares
              their experience.
            </p>

          </div>

        )}

      </div>


      {/* =================================================
          MODAL
          ================================================= */}

      {isModalOpen && (

        <div
          className="testimonial-modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="testimonial-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="testimonial-modal-close"
              onClick={closeModal}
              aria-label="Close testimonial form"
            >
              <X size={20} />
            </button>


            <div className="testimonial-submit-header">

              <div className="testimonials-placeholder-icon">
                <MessageCircleMore size={26} />
              </div>

              <div>
                <span className="testimonials-placeholder-eyebrow">
                  Your voice matters
                </span>

                <h3>
                  Share your experience
                </h3>
              </div>

            </div>


            <p className="testimonial-submit-description">
              Tell us about your experience
              with UNWIND. Display your name
              or remain completely anonymous.
            </p>


            <form
              className="testimonial-form"
              onSubmit={handleSubmit}
            >

              <div className="testimonial-form-group">

                <label className="testimonial-form-label">
                  How should we display your testimonial?
                </label>


                <div className="testimonial-display-options">

                  <button
                    type="button"
                    className={
                      displayMode === "name"
                        ? "testimonial-display-option active"
                        : "testimonial-display-option"
                    }
                    onClick={() =>
                      handleDisplayModeChange(
                        "name"
                      )
                    }
                  >
                    <UserRound size={18} />
                    My name
                  </button>


                  <button
                    type="button"
                    className={
                      displayMode === "anonymous"
                        ? "testimonial-display-option active"
                        : "testimonial-display-option"
                    }
                    onClick={() =>
                      handleDisplayModeChange(
                        "anonymous"
                      )
                    }
                  >
                    <EyeOff size={18} />
                    Anonymous
                  </button>

                </div>

              </div>


              {displayMode === "name" && (

                <div className="testimonial-form-group">

                  <label
                    htmlFor="testimonial-name"
                    className="testimonial-form-label"
                  >
                    Your name
                  </label>

                  <input
                    id="testimonial-name"
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    maxLength={100}
                    className="testimonial-input"
                  />

                </div>

              )}


              <div className="testimonial-form-group">

                <label
                  htmlFor="testimonial-text"
                  className="testimonial-form-label"
                >
                  Your experience
                </label>

                <textarea
                  id="testimonial-text"
                  name="testimonial_text"
                  value={
                    formData.testimonial_text
                  }
                  onChange={handleInputChange}
                  placeholder="Share your experience with UNWIND..."
                  maxLength={1000}
                  rows={5}
                  className="testimonial-textarea"
                />

                <span className="testimonial-character-count">
                  {
                    formData.testimonial_text
                      .length
                  }
                  /1000
                </span>

              </div>


              <div className="testimonial-form-group">

                <label className="testimonial-form-label">
                  Your rating
                </label>


                <div className="testimonial-rating">

                  {[1, 2, 3, 4, 5].map(
                    (star) => (

                      <button
                        key={star}
                        type="button"
                        className={
                          star <=
                          Number(formData.rating)
                            ? "testimonial-star active"
                            : "testimonial-star"
                        }
                        onClick={() =>
                          setFormData(
                            (previous) => ({
                              ...previous,
                              rating: star,
                            })
                          )
                        }
                      >

                        <Star
                          size={24}
                          fill={
                            star <=
                            Number(formData.rating)
                              ? "currentColor"
                              : "none"
                          }
                        />

                      </button>

                    )
                  )}

                </div>

              </div>


              {submitError && (
                <div className="testimonial-form-error">
                  {submitError}
                </div>
              )}


              {submitMessage && (
                <div className="testimonial-form-success">

                  <CheckCircle2 size={18} />

                  {submitMessage}

                </div>
              )}


              <button
                type="submit"
                className="testimonial-submit-button"
                disabled={isSubmitting}
              >

                {isSubmitting ? (
                  "Sharing..."
                ) : (
                  <>
                    <Send size={18} />
                    Share testimonial
                  </>
                )}

              </button>

            </form>

          </div>

        </div>

      )}

    </section>
  );
}

export default TestimonialsSection;